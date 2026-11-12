"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db, users, sessions } from "@/src/db";
import {
  createSession, destroySession, hashPassword, verifyPassword,
  isRateLimited, recordFailedLogin, clearFailedLogins, clientIp, getCurrentUser,
} from "@/src/lib/auth";
import { hitRateLimit } from "@/src/lib/ratelimit";
import { consumeToken, sendPasswordResetEmail, sendVerificationEmail } from "@/src/lib/tokens";
import { sendEmail, templates } from "@/src/lib/email";
import { emailSchema, firstError, values, type FormState } from "@/src/lib/forms";

const safeNext = (n: unknown) => {
  const s = String(n ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters for your password.")
  .max(200)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number.");

const signupSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["BUILDER", "ORGANISATION", "PARTNER"], { message: "Choose how you’ll use AI Nation." }),
  organisation: z.string().trim().max(150).optional(),
  terms: z.literal("on", { message: "Please accept the terms to continue." }),
});

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  const parsed = signupSchema.safeParse({ ...Object.fromEntries(fd), terms: fd.get("terms") ?? undefined });
  if (!parsed.success) return { error: firstError(parsed.error), values: v };
  const d = parsed.data;
  if (d.role !== "BUILDER" && !d.organisation)
    return { error: "Add the name of your organisation or community.", values: v };

  const existing = await db.query.users.findFirst({ where: eq(users.email, d.email), columns: { id: true } });
  if (existing) return { error: "An account with that email already exists. Try signing in.", values: v };

  const [u] = await db
    .insert(users)
    .values({
      name: d.name,
      email: d.email,
      passwordHash: await hashPassword(d.password),
      role: d.role,
      organisation: d.organisation || null,
    })
    .returning({ id: users.id });
  await createSession(u.id);
  after(() => sendVerificationEmail({ id: u.id, email: d.email, name: d.name }));
  redirect(d.role === "BUILDER" ? "/dashboard/passport?welcome=1" : d.role === "PARTNER" ? "/dashboard/community?welcome=1" : "/dashboard?welcome=1");
}

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") });

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error), values: v };
  const { email, password } = parsed.data;

  if (await isRateLimited(email))
    return { error: "Too many attempts. Please wait 15 minutes and try again.", values: v };

  const u = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Always run a hash comparison so response time doesn't reveal whether the email exists
  const ok = await verifyPassword(password, u?.passwordHash ?? "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.r5sQ6n3bqv1aJXmNPFdG0b7zk4qC");
  if (!u || !ok) {
    await recordFailedLogin(email);
    return { error: "That email and password don’t match.", values: v };
  }
  if (u.suspended) return { error: "This account is suspended. Contact the AI Nation team.", values: v };
  await clearFailedLogins(email);
  await createSession(u.id);
  redirect(safeNext(fd.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/* ---------------- Email verification ---------------- */

export async function resendVerification(_: FormState, __: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) return { ok: "Your email is already confirmed." };
  if (await hitRateLimit(`verify:${user.id}`, 3, 60 * 60 * 1000))
    return { error: "We’ve sent a few links already. Check your spam folder, or try again in an hour." };
  await sendVerificationEmail(user);
  return { ok: `We’ve sent a new link to ${user.email}.` };
}

/* ---------------- Password reset ---------------- */

const forgotSchema = z.object({ email: emailSchema });

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  const p = forgotSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: v };
  const done = { ok: `If an account exists for ${p.data.email}, we’ve emailed a link to reset the password. It works for one hour.` };
  const ip = await clientIp();
  if ((await hitRateLimit(`reset-ip:${ip}`, 10, 60 * 60 * 1000)) || (await hitRateLimit(`reset:${p.data.email}`, 3, 60 * 60 * 1000))) return done;
  // Send after the response so timing doesn't reveal whether the account exists.
  after(() => sendPasswordResetEmail(p.data.email));
  return done;
}

const resetSchema = z
  .object({ token: z.string().min(10).max(100), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "The two passwords don’t match.", path: ["confirm"] });

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const p = resetSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const userId = await consumeToken(p.data.token, "RESET_PASSWORD");
  if (!userId) return { error: "This reset link has expired or was already used. Request a new one." };
  const [u] = await db
    .update(users)
    // they proved they control the inbox, so the email counts as confirmed too
    .set({ passwordHash: await hashPassword(p.data.password), emailVerifiedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ email: users.email, name: users.name, suspended: users.suspended });
  await db.delete(sessions).where(eq(sessions.userId, userId)); // sign out everywhere
  await clearFailedLogins(u.email);
  after(() => sendEmail(templates.passwordChanged(u.email, u.name)));
  if (u.suspended) redirect("/login?reset=1");
  await createSession(userId);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?reset=1");
}

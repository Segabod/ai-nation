"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/src/db";
import {
  createSession, destroySession, hashPassword, verifyPassword,
  isRateLimited, recordFailedLogin, clearFailedLogins,
} from "@/src/lib/auth";
import { emailSchema, firstError, values, type FormState } from "@/src/lib/forms";

const safeNext = (n: unknown) => {
  const s = String(n ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

const signupSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(100),
  email: emailSchema,
  password: z
    .string()
    .min(10, "Use at least 10 characters for your password.")
    .max(200)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number."),
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

"use server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, users, projects, briefs, interests, communities, registrations, inquiries } from "@/src/db";
import { clientIp, getCurrentUser, requireUser } from "@/src/lib/auth";
import { hitRateLimit } from "@/src/lib/ratelimit";
import { SECTORS, ENGAGEMENTS, COMMUNITY_KINDS, ATTEND_AS, TOPICS, PARTNER_TYPES, PARTNER_WAYS, EMPLOYER_OPTIONS, EMPLOYER_SIZES } from "@/src/lib/constants";
import { emailSchema, firstError, list, urlSchema, values, type FormState } from "@/src/lib/forms";

const txt = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max);

/* ---------------- Builder: Skills Passport ---------------- */

const profileSchema = z.object({
  name: txt(2, 100, "Tell us your name."),
  headline: z.string().trim().max(140).optional(),
  location: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(1500).optional(),
});

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  const links = list(fd.get("links"), 6);
  for (const l of links) {
    const r = urlSchema.safeParse(l);
    if (!r.success) return { error: `“${l}” isn’t a valid link. Use full https:// addresses.`, values: values(fd) };
  }
  await db
    .update(users)
    .set({
      name: p.data.name,
      headline: p.data.headline || null,
      location: p.data.location || null,
      bio: p.data.bio || null,
      skills: list(fd.get("skills"), 20),
      links,
      openToWork: fd.get("openToWork") === "on",
      organisation: user.role === "BUILDER" ? (String(fd.get("organisation") || "").trim() || null) : user.organisation,
    })
    .where(eq(users.id, user.id));
  revalidatePath("/dashboard", "layout");
  return { ok: "Profile saved." };
}

const projectSchema = z.object({
  title: txt(3, 120, "Give the project a title."),
  context: txt(20, 1500, "Describe the project context in at least 20 characters."),
  contribution: txt(20, 1500, "Describe your individual contribution in at least 20 characters."),
  url: urlSchema.optional(),
});

export async function addProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["BUILDER"]);
  const p = projectSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  await db.insert(projects).values({
    userId: user.id,
    title: p.data.title,
    context: p.data.context,
    contribution: p.data.contribution,
    url: p.data.url || null,
    stack: list(fd.get("stack"), 12),
  });
  revalidatePath("/dashboard/passport");
  return { ok: "Project added to your passport." };
}

export async function deleteProject(fd: FormData) {
  const user = await requireUser(["BUILDER"]);
  // ownership enforced in the WHERE clause
  await db.delete(projects).where(and(eq(projects.id, String(fd.get("id"))), eq(projects.userId, user.id)));
  revalidatePath("/dashboard/passport");
}

/* ---------------- Builder: express interest in a brief ---------------- */

export async function expressInterest(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["BUILDER"]);
  const briefId = String(fd.get("briefId"));
  const pitch = String(fd.get("pitch") || "").trim();
  if (pitch.length < 30) return { error: "Tell the team why you’re a fit in at least 30 characters.", values: values(fd) };
  if (pitch.length > 2000) return { error: "Keep your note under 2,000 characters.", values: values(fd) };
  const brief = await db.query.briefs.findFirst({ where: eq(briefs.id, briefId) });
  if (!brief || brief.status !== "OPEN") return { error: "This brief isn’t accepting interest right now." };
  if (brief.isSample) return { error: "This is a sample brief, so it isn’t open for applications." };
  const res = await db.insert(interests).values({ briefId, userId: user.id, pitch }).onConflictDoNothing().returning({ id: interests.id });
  if (!res.length) return { error: "You’ve already expressed interest in this brief." };
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
  return { ok: "Interest sent. The team will see your note and Skills Passport." };
}

export async function withdrawInterest(fd: FormData) {
  const user = await requireUser(["BUILDER"]);
  await db.delete(interests).where(and(eq(interests.id, String(fd.get("id"))), eq(interests.userId, user.id)));
  revalidatePath("/dashboard");
}

/* ---------------- Organisation: briefs ---------------- */


const briefSchema = z.object({
  title: txt(6, 140, "Give the brief a clear title."),
  sector: z.enum(SECTORS, { message: "Choose a sector." }),
  summary: txt(40, 3000, "Describe the business need in at least 40 characters."),
  outcomes: txt(20, 2000, "Describe what success looks like in at least 20 characters."),
  engagement: z.enum(ENGAGEMENTS, { message: "Choose an engagement model." }),
  budget: z.string().trim().max(120).optional(),
});

export async function createBrief(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["ORGANISATION"]);
  const p = briefSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  const [b] = await db
    .insert(briefs)
    .values({ ...p.data, budget: p.data.budget || null, ownerId: user.id, status: user.role === "ADMIN" ? "OPEN" : "PENDING" })
    .returning({ id: briefs.id });
  revalidatePath("/briefs");
  redirect(`/dashboard/briefs/${b.id}?created=1`);
}

async function ownBrief(briefId: string) {
  const user = await requireUser(["ORGANISATION"]);
  const brief = await db.query.briefs.findFirst({ where: eq(briefs.id, briefId) });
  if (!brief || (brief.ownerId !== user.id && user.role !== "ADMIN")) throw new Error("Not allowed");
  return { user, brief };
}

export async function setBriefStatus(fd: FormData) {
  const briefId = String(fd.get("briefId"));
  const status = String(fd.get("status"));
  const { brief, user } = await ownBrief(briefId);
  // owners can move between OPEN / IN_PROGRESS / CLOSED once approved; only admins approve PENDING
  const allowed = user.role === "ADMIN" ? ["PENDING", "OPEN", "IN_PROGRESS", "CLOSED", "REJECTED"] : ["OPEN", "IN_PROGRESS", "CLOSED"];
  if (!allowed.includes(status)) return;
  if (user.role !== "ADMIN" && (brief.status === "PENDING" || brief.status === "REJECTED")) return;
  await db.update(briefs).set({ status: status as typeof brief.status }).where(eq(briefs.id, briefId));
  revalidatePath(`/dashboard/briefs/${briefId}`);
  revalidatePath("/briefs");
}

export async function setInterestStatus(fd: FormData) {
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (!["SUBMITTED", "SHORTLISTED", "ACCEPTED", "DECLINED"].includes(status)) return;
  const row = await db.query.interests.findFirst({ where: eq(interests.id, id) });
  if (!row) return;
  await ownBrief(row.briefId);
  await db.update(interests).set({ status: status as typeof row.status }).where(eq(interests.id, id));
  revalidatePath(`/dashboard/briefs/${row.briefId}`);
}

/* ---------------- Partner: community ---------------- */

const communitySchema = z.object({
  name: txt(2, 140, "Name your campus or community."),
  kind: z.enum(COMMUNITY_KINDS, { message: "Choose a type." }),
  size: z.string().trim().max(60).optional(),
  description: txt(30, 2000, "Describe your community in at least 30 characters."),
  website: urlSchema.optional(),
});

export async function saveCommunity(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["PARTNER"]);
  const p = communitySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  const data = { ...p.data, size: p.data.size || null, website: p.data.website || null };
  await db
    .insert(communities)
    .values({ ...data, userId: user.id })
    .onConflictDoUpdate({ target: communities.userId, set: data });
  revalidatePath("/dashboard", "layout");
  return { ok: "Community profile saved." };
}

/* ---------------- Public: Open House + contact ---------------- */

const regSchema = z.object({
  name: txt(2, 100, "Tell us your name."),
  email: emailSchema,
  attendAs: z.enum(ATTEND_AS, { message: "Choose how you’d like to take part." }),
  organisation: z.string().trim().max(140).optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function registerOpenHouse(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("company_website")) return { ok: "Thanks, you’re on the list." }; // honeypot
  const p = regSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  const user = await getCurrentUser();
  const res = await db
    .insert(registrations)
    .values({ ...p.data, organisation: p.data.organisation || null, note: p.data.note || null, userId: user?.id ?? null })
    .onConflictDoNothing()
    .returning({ id: registrations.id });
  if (!res.length) return { ok: "You’re already on the list. We’ll be in touch when a date is confirmed." };
  return { ok: "You’re on the list. We’ll share the programme as soon as a date is confirmed." };
}

const inquirySchema = z.object({
  name: txt(2, 100, "Tell us your name."),
  email: emailSchema,
  topic: z.enum(TOPICS, { message: "Choose a topic." }),
  message: txt(20, 3000, "Tell us a little more, at least 20 characters."),
});

/* ---------------- Partner with us ---------------- */

const partnerSchema = z.object({
  name: txt(2, 100, "Tell us your name."),
  email: emailSchema,
  organisation: txt(2, 140, "Tell us which organisation you’re with."),
  partnerType: z.enum(PARTNER_TYPES, { message: "Choose what kind of organisation you are." }),
  partnerWay: z.enum(PARTNER_WAYS, { message: "Choose how you’d like to partner." }),
  website: urlSchema.optional(),
  message: z.string().trim().max(2000, "Keep your note under 2,000 characters.").optional(),
});

/** Partner enquiries land in the admin inbox under the "Partnership" topic, with the details on top. */
export async function sendPartnership(_: FormState, fd: FormData): Promise<FormState> {
  const thanks = "Thanks for reaching out. We’ll reply within two working days to set up a first conversation.";
  if (fd.get("company_website")) return { ok: thanks };
  const p = partnerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  if (await hitRateLimit(`partner:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: "We’ve had several requests from your network in the last hour. Please try again later.", values: values(fd) };
  }
  const d = p.data;
  const message = [
    `Organisation: ${d.organisation}`,
    `Type: ${d.partnerType}`,
    `Interested in: ${d.partnerWay}`,
    d.website ? `Website: ${d.website}` : null,
    "",
    d.message || "(No note added.)",
  ].filter((l) => l !== null).join("\n");
  await db.insert(inquiries).values({ name: d.name, email: d.email, topic: "Partnership", message });
  return { ok: thanks };
}

/* ---------------- Employers ---------------- */

const employerSchema = z.object({
  name: txt(2, 100, "Tell us your name."),
  email: emailSchema,
  organisation: txt(2, 140, "Tell us which organisation you’re with."),
  size: z.enum(EMPLOYER_SIZES, { message: "Choose your organisation’s size." }),
  option: z.enum(EMPLOYER_OPTIONS, { message: "Choose how you’d like to work with builders." }),
  website: urlSchema.optional(),
  message: z.string().trim().max(2000, "Keep your note under 2,000 characters.").optional(),
});

/** Employer enquiries land in the admin inbox under the "I need a team" topic, with the details on top. */
export async function sendEmployerEnquiry(_: FormState, fd: FormData): Promise<FormState> {
  const thanks = "Thanks. We’ll reply within two working days to book a 30 minute discovery call.";
  if (fd.get("company_website")) return { ok: thanks };
  const p = employerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  if (await hitRateLimit(`employer:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: "We’ve had several requests from your network in the last hour. Please try again later.", values: values(fd) };
  }
  const d = p.data;
  const message = [
    `Organisation: ${d.organisation} (${d.size})`,
    `Interested in: ${d.option}`,
    d.website ? `Website: ${d.website}` : null,
    "",
    d.message || "(No note added.)",
  ].filter((l) => l !== null).join("\n");
  await db.insert(inquiries).values({ name: d.name, email: d.email, topic: "I need a team", message });
  return { ok: thanks };
}

export async function sendInquiry(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("company_website")) return { ok: "Thanks, message received." };
  const p = inquirySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error), values: values(fd) };
  await db.insert(inquiries).values(p.data);
  return { ok: "Thanks, message received. Someone from AI Nation will reply within two working days." };
}

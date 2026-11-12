"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users, briefs, inquiries, sessions } from "@/src/db";
import { requireAdmin } from "@/src/lib/auth";
import { after } from "next/server";
import { notifyBriefDecision } from "@/src/lib/notify";

const ROLES = ["BUILDER", "ORGANISATION", "PARTNER", "ADMIN"] as const;
const BRIEF = ["PENDING", "OPEN", "IN_PROGRESS", "CLOSED", "REJECTED"] as const;

export async function adminSetRole(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const role = String(fd.get("role")) as (typeof ROLES)[number];
  if (!ROLES.includes(role) || id === admin.id) return; // admins can't demote themselves
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin");
}

export async function adminToggleSuspend(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  if (id === admin.id) return;
  const u = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!u) return;
  await db.update(users).set({ suspended: !u.suspended }).where(eq(users.id, id));
  if (!u.suspended) await db.delete(sessions).where(eq(sessions.userId, id)); // sign them out everywhere
  revalidatePath("/admin");
}

export async function adminSetBriefStatus(fd: FormData) {
  await requireAdmin();
  const status = String(fd.get("status")) as (typeof BRIEF)[number];
  if (!BRIEF.includes(status)) return;
  const id = String(fd.get("id"));
  const before = await db.query.briefs.findFirst({ where: eq(briefs.id, id), columns: { status: true } });
  if (!before || before.status === status) return;
  await db.update(briefs).set({ status }).where(eq(briefs.id, id));
  if (before.status === "PENDING" && (status === "OPEN" || status === "REJECTED")) after(() => notifyBriefDecision(id, status === "OPEN"));
  revalidatePath("/admin");
  revalidatePath("/briefs");
}

export async function adminToggleInquiry(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const q = await db.query.inquiries.findFirst({ where: eq(inquiries.id, id) });
  if (!q) return;
  await db.update(inquiries).set({ handled: !q.handled }).where(eq(inquiries.id, id));
  revalidatePath("/admin");
}

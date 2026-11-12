import "server-only";
import { eq } from "drizzle-orm";
import { db, briefs, interests, users } from "@/src/db";
import { appUrl, sendEmail, templates } from "@/src/lib/email";

/** Tells a builder their application moved to shortlisted, accepted or declined. */
export async function notifyInterestStatus(interestId: string) {
  const row = await db.query.interests.findFirst({
    where: eq(interests.id, interestId),
    with: { user: { columns: { email: true, name: true, suspended: true } }, brief: { columns: { title: true } } },
  });
  if (!row || row.user.suspended) return;
  if (row.status !== "SHORTLISTED" && row.status !== "ACCEPTED" && row.status !== "DECLINED") return;
  await sendEmail(templates.interestStatus(row.user.email, row.user.name, row.brief.title, row.status, `${appUrl()}/dashboard`));
}

/** Tells an organisation a builder has expressed interest in their brief. */
export async function notifyNewInterest(briefId: string, builderName: string) {
  const b = await db.query.briefs.findFirst({ where: eq(briefs.id, briefId), with: { owner: { columns: { email: true, name: true, suspended: true } } } });
  if (!b || b.owner.suspended) return;
  await sendEmail(templates.newInterest(b.owner.email, b.owner.name, b.title, builderName, `${appUrl()}/dashboard/briefs/${b.id}`));
}

/** Tells an organisation their pending brief was approved (now OPEN) or rejected. */
export async function notifyBriefDecision(briefId: string, approved: boolean) {
  const b = await db.query.briefs.findFirst({ where: eq(briefs.id, briefId), columns: { id: true, title: true, ownerId: true } });
  if (!b) return;
  const owner = await db.query.users.findFirst({ where: eq(users.id, b.ownerId), columns: { email: true, name: true, suspended: true, role: true } });
  if (!owner || owner.suspended || owner.role === "ADMIN") return;
  await sendEmail(templates.briefDecision(owner.email, owner.name, b.title, approved, `${appUrl()}/dashboard/briefs/${b.id}`));
}

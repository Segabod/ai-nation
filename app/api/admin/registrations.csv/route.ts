import { desc } from "drizzle-orm";
import { db, registrations } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const rows = await db.select().from(registrations).orderBy(desc(registrations.createdAt));
  const csv = [
    ["Name", "Email", "Attending as", "Organisation", "Note", "Registered"].map(cell).join(","),
    ...rows.map((r) => [r.name, r.email, r.attendAs, r.organisation, r.note, r.createdAt.toISOString()].map(cell).join(",")),
  ].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="open-house-registrations.csv"' },
  });
}

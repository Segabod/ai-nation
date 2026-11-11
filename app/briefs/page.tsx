import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, briefs } from "@/src/db";
import { SECTORS } from "@/src/lib/constants";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = { title: "Project briefs" };
export const dynamic = "force-dynamic";

export default async function BriefsPage({ searchParams }: { searchParams: Promise<{ sector?: string }> }) {
  const { sector } = await searchParams;
  const valid = SECTORS.includes(sector as (typeof SECTORS)[number]) ? sector : undefined;
  const user = await getCurrentUser();
  const rows = await db.query.briefs.findMany({
    where: valid ? and(eq(briefs.status, "OPEN"), eq(briefs.sector, valid)) : eq(briefs.status, "OPEN"),
    orderBy: desc(briefs.createdAt),
    with: { owner: { columns: { organisation: true } } },
  });

  return (
    <div className="page wrap">
      <div className="page-head">
        <div>
          <p className="eyebrow o">Open briefs</p>
          <h1>Useful work, worth building.</h1>
          <p>Real business needs from organisations on AI Nation. Builders can express interest with a short note and their Skills Passport.</p>
        </div>
        {(!user || user.role === "ORGANISATION" || user.role === "ADMIN") && (
          <Link href="/briefs/new" className="btn btn-primary">Publish a brief <span className="ar">↗</span></Link>
        )}
      </div>

      <nav className="tabs" aria-label="Filter by sector">
        <Link href="/briefs" className="tab" aria-selected={!valid}>All</Link>
        {SECTORS.map((s) => (
          <Link key={s} href={`/briefs?sector=${encodeURIComponent(s)}`} className="tab" aria-selected={valid === s}>{s}</Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="empty">
          <p style={{ fontFamily: "var(--display)", fontSize: 20, color: "var(--ink)" }}>No open briefs here yet.</p>
          <p style={{ marginTop: 6 }}>Organisations can publish the first one. Builders: start your passport so you’re ready.</p>
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <Link href="/briefs/new" className="btn btn-primary btn-sm">Publish a brief</Link>
            <Link href="/signup?role=builder" className="btn btn-ghost btn-sm">Start my passport</Link>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {rows.map((b) => (
            <Link key={b.id} href={`/briefs/${b.id}`} className="item">
              <div className="row"><span className="chip blue">{b.sector}</span><span className="chip">{b.engagement}</span>{b.isSample && <span className="chip orange">Sample</span>}</div>
              <h3>{b.title}</h3>
              <p className="muted" style={{ fontSize: 14.5 }}>{b.summary.length > 180 ? b.summary.slice(0, 180) + "…" : b.summary}</p>
              <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>{b.owner.organisation ?? "AI Nation partner"}{b.budget ? ` · ${b.budget}` : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

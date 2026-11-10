import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, users, projects } from "@/src/db";
import { requireUser } from "@/src/lib/auth";

export const metadata = { title: "Talent directory" };
export const dynamic = "force-dynamic";

export default async function Talent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser(["ORGANISATION"]); // organisations and admins
  const { q } = await searchParams;
  const term = (q ?? "").trim().slice(0, 60);
  const like = `%${term.replace(/[%_\\]/g, (m) => "\\" + m)}%`;

  const rows = await db
    .select({
      id: users.id, name: users.name, headline: users.headline, skills: users.skills,
      organisation: users.organisation, location: users.location,
      projects: sql<number>`(select count(*)::int from ${projects} where ${projects.userId} = ${users.id})`,
    })
    .from(users)
    .where(and(
      eq(users.role, "BUILDER"), eq(users.openToWork, true), eq(users.suspended, false),
      term ? or(ilike(users.name, like), ilike(users.headline, like), ilike(users.organisation, like),
        sql`exists (select 1 from unnest(${users.skills}) s where s ilike ${like})`) : undefined,
    ))
    .orderBy(desc(users.createdAt))
    .limit(60);

  return (
    <div className="page wrap">
      <div className="page-head">
        <div><p className="eyebrow o">Assessed talent</p><h1>Builders open to work.</h1><p>Every profile is backed by project evidence and individual contributions, not just a CV.</p></div>
        <form className="row" role="search">
          <label htmlFor="q" className="sr-only">Search talent</label>
          <input id="q" name="q" className="input" placeholder="Skill, school or name" defaultValue={term} style={{ width: 260 }} />
          <button className="btn btn-blue btn-sm">Search</button>
        </form>
      </div>
      {rows.length === 0 ? <p className="empty">No builders match{term ? ` “${term}”` : " yet"}.</p> : (
        <div className="grid-3">
          {rows.map((r) => (
            <Link key={r.id} href={`/talent/${r.id}`} className="item stack" style={{ gap: 10 }}>
              <div className="row">
                <span className="avatar" aria-hidden>{r.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                <div><b style={{ fontFamily: "var(--display)" }}>{r.name}</b><div className="dim" style={{ fontSize: 13 }}>{r.organisation ?? r.location ?? "Independent"}</div></div>
              </div>
              <p className="muted" style={{ fontSize: 14.5 }}>{r.headline ?? "Builder"}</p>
              <div className="tags">{r.skills.slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}</div>
              <span className="chip orange" style={{ justifySelf: "start" }}>{r.projects} project{r.projects === 1 ? "" : "s"} in passport</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

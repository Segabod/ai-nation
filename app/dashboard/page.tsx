import Link from "next/link";
import { and, count, desc, eq, ilike, inArray, ne } from "drizzle-orm";
import { db, briefs, interests, projects, users, communities, registrations } from "@/src/db";
import { requireUser } from "@/src/lib/auth";
import { STATUS_CHIP, pretty } from "@/src/lib/constants";
import { withdrawInterest } from "@/app/actions/app";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const first = user.name.split(" ")[0];

  const banner = (
    <>
      {sp.denied && <p className="notice err" style={{ marginBottom: 16 }}>That area isn’t available for your account type.</p>}
      {sp.welcome && <p className="notice ok" style={{ marginBottom: 16 }}>Welcome to AI Nation, {first}. Your account is ready.</p>}
    </>
  );

  if (user.role === "BUILDER") {
    const [mine, projs, open] = await Promise.all([
      db.query.interests.findMany({ where: eq(interests.userId, user.id), orderBy: desc(interests.createdAt), with: { brief: { columns: { id: true, title: true, sector: true, status: true } } } }),
      db.select({ n: count() }).from(projects).where(eq(projects.userId, user.id)),
      db.query.briefs.findMany({ where: eq(briefs.status, "OPEN"), orderBy: desc(briefs.createdAt), limit: 4 }),
    ]);
    const nProj = projs[0].n;
    const checks = [!!user.headline, !!user.bio, user.skills.length >= 3, nProj >= 1, user.links.length >= 1];
    const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    const applied = new Set(mine.map((m) => m.briefId));
    return (
      <div className="stack">
        {banner}
        <div className="page-head" style={{ marginBottom: 6 }}><div><p className="eyebrow o">Builder</p><h1>Hi {first}.</h1><p>Show the work, grow your skills, find your fit.</p></div></div>
        <div className="grid-3">
          <div className="stat"><b>{pct}%</b><span>Passport complete</span></div>
          <div className="stat"><b>{nProj}</b><span>Projects in your passport</span></div>
          <div className="stat"><b>{mine.length}</b><span>Briefs you’ve applied to</span></div>
        </div>
        {pct < 100 && (
          <div className="card between">
            <div><h2>Strengthen your passport</h2><p className="muted">Add a headline, a short bio, at least three skills, a project and a link.</p></div>
            <Link href="/dashboard/passport" className="btn btn-primary">Open passport <span className="ar">↗</span></Link>
          </div>
        )}
        <div className="grid-2">
          <div className="card stack">
            <h2>My applications</h2>
            {mine.length === 0 ? <p className="empty">No applications yet. Find a brief that fits your work.</p> : (
              <div className="list">
                {mine.map((m) => (
                  <div key={m.id} className="item">
                    <div className="between">
                      <span className={`chip ${STATUS_CHIP[m.status]}`}>{pretty(m.status)}</span>
                      {m.status === "SUBMITTED" && (
                        <form action={withdrawInterest}><input type="hidden" name="id" value={m.id} /><button className="linkish" style={{ fontSize: 13 }}>Withdraw</button></form>
                      )}
                    </div>
                    <h3><Link href={`/briefs/${m.brief.id}`}>{m.brief.title}</Link></h3>
                    <p className="dim" style={{ fontSize: 13 }}>{m.brief.sector}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card stack">
            <div className="between"><h2>Open briefs</h2><Link href="/briefs" className="linkish">See all →</Link></div>
            {open.length === 0 ? <p className="empty">No open briefs right now. We’ll show them here as they’re approved.</p> : (
              <div className="list">
                {open.map((b) => (
                  <Link key={b.id} href={`/briefs/${b.id}`} className="item">
                    <div className="row"><span className="chip blue">{b.sector}</span>{applied.has(b.id) && <span className="chip ok">Applied</span>}</div>
                    <h3>{b.title}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "ORGANISATION") {
    const mine = await db.query.briefs.findMany({ where: eq(briefs.ownerId, user.id), orderBy: desc(briefs.createdAt), with: { interests: { columns: { id: true, status: true } } } });
    const totalInterest = mine.reduce((a, b) => a + b.interests.length, 0);
    const [builders] = await db.select({ n: count() }).from(users).where(and(eq(users.role, "BUILDER"), eq(users.openToWork, true), eq(users.suspended, false)));
    return (
      <div className="stack">
        {banner}
        <div className="page-head" style={{ marginBottom: 6 }}>
          <div><p className="eyebrow o">{user.organisation ?? "Organisation"}</p><h1>Hi {first}.</h1><p>Publish briefs, review interest and meet builders who have shown their work.</p></div>
          <Link href="/briefs/new" className="btn btn-primary">Publish a brief <span className="ar">↗</span></Link>
        </div>
        <div className="grid-3">
          <div className="stat"><b>{mine.length}</b><span>Your briefs</span></div>
          <div className="stat"><b>{totalInterest}</b><span>Builder applications received</span></div>
          <Link href="/talent" className="stat"><b>{builders.n}</b><span>Builders open to work →</span></Link>
        </div>
        <div className="card stack">
          <h2>Your briefs</h2>
          {mine.length === 0 ? (
            <div className="empty">
              <p>You haven’t published a brief yet. Start from a template or describe your own need.</p>
              <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
                {["Knowledge", "Insurance", "Commerce", "Healthcare"].map((s) => <Link key={s} className="chip blue" href={`/briefs/new?sector=${s}`}>{s} template</Link>)}
              </div>
            </div>
          ) : (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Brief</th><th>Status</th><th>Applications</th><th>Shortlisted</th><th /></tr></thead>
              <tbody>
                {mine.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.title}</b><div className="dim" style={{ fontSize: 13 }}>{b.sector} · {b.engagement}</div></td>
                    <td><span className={`chip ${STATUS_CHIP[b.status]}`}>{b.status === "PENDING" ? "In review" : pretty(b.status)}</span></td>
                    <td>{b.interests.length}</td>
                    <td>{b.interests.filter((i) => i.status === "SHORTLISTED" || i.status === "ACCEPTED").length}</td>
                    <td><Link className="btn btn-ghost btn-sm" href={`/dashboard/briefs/${b.id}`}>Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    );
  }

  if (user.role === "PARTNER") {
    const c = await db.query.communities.findFirst({ where: eq(communities.userId, user.id) });
    const members = c
      ? await db.query.users.findMany({ where: and(eq(users.role, "BUILDER"), ilike(users.organisation, `%${c.name.replace(/[%_\\]/g, (m) => "\\" + m)}%`)), columns: { id: true, name: true, headline: true, skills: true }, limit: 12 })
      : [];
    const memberIds = members.map((m) => m.id);
    const apps = memberIds.length ? await db.select({ n: count() }).from(interests).where(inArray(interests.userId, memberIds)) : [{ n: 0 }];
    return (
      <div className="stack">
        {banner}
        <div className="page-head" style={{ marginBottom: 6 }}><div><p className="eyebrow o">Community partner</p><h1>Hi {first}.</h1><p>Connect your community’s talent with practical projects and meaningful work.</p></div></div>
        {!c ? (
          <div className="card between">
            <div><h2>Register your community</h2><p className="muted">Tell us about your campus, hackathon community or hub so builders can link to it.</p></div>
            <Link href="/dashboard/community" className="btn btn-primary">Set up community <span className="ar">↗</span></Link>
          </div>
        ) : (
          <>
            <div className="grid-3">
              <div className="stat"><b>{members.length}</b><span>Builders linked to {c.name}</span></div>
              <div className="stat"><b>{apps[0].n}</b><span>Applications by your builders</span></div>
              <div className="stat"><b>{c.kind}</b><span>Community type</span></div>
            </div>
            <div className="card stack">
              <div className="between"><h2>Your builders</h2><Link href="/dashboard/community" className="linkish">Edit community →</Link></div>
              <p className="muted" style={{ fontSize: 14 }}>Builders appear here when their school or community on their passport matches “{c.name}”. Share this sign-up link: <code>/signup?role=builder</code></p>
              {members.length === 0 ? <p className="empty">No builders linked yet.</p> : (
                <div className="grid-2">{members.map((m) => (
                  <div className="item" key={m.id}><h3>{m.name}</h3><p className="dim" style={{ fontSize: 13.5 }}>{m.headline ?? "Builder"}</p><div className="tags" style={{ marginTop: 8 }}>{m.skills.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}</div></div>
                ))}</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ADMIN
  const [[u], [b], [p], [r]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(briefs).where(eq(briefs.status, "PENDING")),
    db.select({ n: count() }).from(projects),
    db.select({ n: count() }).from(registrations),
  ]);
  const [openB] = await db.select({ n: count() }).from(briefs).where(ne(briefs.status, "PENDING"));
  return (
    <div className="stack">
      {banner}
      <div className="page-head" style={{ marginBottom: 6 }}><div><p className="eyebrow o">Administrator</p><h1>Hi {first}.</h1></div><Link href="/admin" className="btn btn-primary">Open admin console <span className="ar">↗</span></Link></div>
      <div className="grid-3">
        <div className="stat"><b>{u.n}</b><span>Members</span></div>
        <Link href="/admin#briefs" className="stat"><b>{b.n}</b><span>Briefs awaiting review →</span></Link>
        <div className="stat"><b>{openB.n}</b><span>Reviewed briefs</span></div>
        <div className="stat"><b>{p.n}</b><span>Passport projects</span></div>
        <Link href="/admin#openhouse" className="stat"><b>{r.n}</b><span>Open House registrations →</span></Link>
      </div>
    </div>
  );
}

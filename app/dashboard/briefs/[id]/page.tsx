import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, briefs, interests } from "@/src/db";
import { requireUser } from "@/src/lib/auth";
import { setBriefStatus, setInterestStatus } from "@/app/actions/app";
import { STATUS_CHIP, pretty } from "@/src/lib/constants";

export const dynamic = "force-dynamic";

export default async function ManageBrief({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser(["ORGANISATION"]);
  const { id } = await params;
  const { created } = await searchParams;
  const b = await db.query.briefs.findFirst({ where: eq(briefs.id, id) });
  // authorization: owners and admins only; everyone else gets a 404 rather than a hint the brief exists
  if (!b || (b.ownerId !== user.id && user.role !== "ADMIN")) notFound();

  const apps = await db.query.interests.findMany({
    where: eq(interests.briefId, b.id), orderBy: asc(interests.createdAt),
    with: { user: { columns: { id: true, name: true, headline: true, skills: true, organisation: true, email: true } } },
  });

  const canMove = b.status !== "PENDING" && b.status !== "REJECTED";
  return (
    <div className="stack">
      {created && <p className="notice ok">Brief submitted. Our team reviews new briefs before they go live, usually within two working days.</p>}
      <div className="page-head" style={{ marginBottom: 6 }}>
        <div>
          <div className="row"><span className="chip blue">{b.sector}</span><span className={`chip ${STATUS_CHIP[b.status]}`}>{b.status === "PENDING" ? "In review" : pretty(b.status)}</span></div>
          <h1 style={{ fontSize: "clamp(28px,3.2vw,40px)" }}>{b.title}</h1>
        </div>
        <Link href={`/briefs/${b.id}`} className="btn btn-ghost btn-sm">View public page</Link>
      </div>

      <div className="card between">
        <div><h2>Status</h2><p className="muted" style={{ fontSize: 14.5 }}>{canMove ? "Close the brief when you’ve found your team." : b.status === "PENDING" ? "You’ll be able to manage status once the brief is approved." : "This brief wasn’t approved. Contact us for details."}</p></div>
        {canMove && (
          <div className="row">
            {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => (
              <form key={s} action={setBriefStatus}>
                <input type="hidden" name="briefId" value={b.id} /><input type="hidden" name="status" value={s} />
                <button className={`btn btn-sm ${b.status === s ? "btn-light" : "btn-ghost"}`} disabled={b.status === s}>{pretty(s)}</button>
              </form>
            ))}
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Builder interest ({apps.length})</h2>
        {apps.length === 0 ? <p className="empty">No interest yet. Once the brief is open, builders can apply from the briefs board.</p> : (
          <div className="list">
            {apps.map((a) => (
              <article key={a.id} className="item stack" style={{ gap: 10 }}>
                <div className="between">
                  <div className="row">
                    <span className="avatar" aria-hidden>{a.user.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                    <div>
                      <Link href={`/talent/${a.user.id}`} style={{ fontFamily: "var(--display)", fontWeight: 600 }}>{a.user.name}</Link>
                      <div className="dim" style={{ fontSize: 13 }}>{a.user.headline ?? "Builder"}{a.user.organisation ? ` · ${a.user.organisation}` : ""}</div>
                    </div>
                  </div>
                  <span className={`chip ${STATUS_CHIP[a.status]}`}>{pretty(a.status)}</span>
                </div>
                <p style={{ whiteSpace: "pre-wrap", fontSize: 14.5 }}>{a.pitch}</p>
                <div className="tags">{a.user.skills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}</div>
                <div className="between">
                  <div className="row">
                    {(["SHORTLISTED", "ACCEPTED", "DECLINED"] as const).map((s) => (
                      <form key={s} action={setInterestStatus}>
                        <input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} />
                        <button className={`btn btn-sm ${s === "DECLINED" ? "btn-danger" : a.status === s ? "btn-light" : "btn-ghost"}`} disabled={a.status === s}>
                          {s === "SHORTLISTED" ? "Shortlist" : s === "ACCEPTED" ? "Accept" : "Decline"}
                        </button>
                      </form>
                    ))}
                  </div>
                  {(a.status === "SHORTLISTED" || a.status === "ACCEPTED") && (
                    <a className="linkish" href={`mailto:${a.user.email}?subject=${encodeURIComponent("AI Nation: " + b.title)}`}>Email {a.user.name.split(" ")[0]} ↗</a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

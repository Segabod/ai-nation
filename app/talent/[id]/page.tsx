import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, users, projects } from "@/src/db";
import { requireUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function Builder({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireUser();
  const { id } = await params;
  // organisations/admins can view any builder; builders can only preview their own passport
  const allowed = viewer.role === "ORGANISATION" || viewer.role === "ADMIN" || viewer.id === id;
  if (!allowed) notFound();
  const u = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!u || u.role !== "BUILDER" || u.suspended) notFound();
  const projs = await db.query.projects.findMany({ where: eq(projects.userId, u.id), orderBy: desc(projects.createdAt) });

  return (
    <div className="page wrap">
      {viewer.id === id && <p className="notice info" style={{ marginBottom: 18 }}>This is how organisations see your passport. <Link className="linkish" href="/dashboard/passport">Edit it</Link></p>}
      <div className="grid-side">
        <div className="stack">
          <div className="card stack">
            <div className="row">
              <span className="avatar" style={{ width: 64, height: 64, fontSize: 22 }} aria-hidden>{u.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
              <div><h1 style={{ fontSize: 34 }}>{u.name}</h1><p className="muted">{u.headline ?? "Builder"}</p></div>
            </div>
            {u.bio && <p style={{ whiteSpace: "pre-wrap" }}>{u.bio}</p>}
          </div>
          <div className="card stack">
            <h2>Project evidence</h2>
            {projs.length === 0 ? <p className="empty">No projects added yet.</p> : projs.map((p) => (
              <article key={p.id} className="item stack" style={{ gap: 8 }}>
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{p.context}</p>
                <p style={{ fontSize: 14.5 }}><b style={{ color: "var(--orange)" }}>Individual contribution: </b>{p.contribution}</p>
                <div className="tags">{p.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="linkish">View project ↗</a>}
              </article>
            ))}
          </div>
        </div>
        <aside className="card stack">
          <p className="eyebrow">Skills Passport</p>
          {u.organisation && <p><span className="dim">School or community</span><br />{u.organisation}</p>}
          {u.location && <p><span className="dim">Location</span><br />{u.location}</p>}
          <div><span className="dim">Skills</span><div className="tags" style={{ marginTop: 6 }}>{u.skills.map((s) => <span key={s} className="chip blue">{s}</span>)}</div></div>
          {u.links.length > 0 && <div className="stack" style={{ gap: 6 }}><span className="dim">Links</span>{u.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" className="linkish" style={{ wordBreak: "break-all" }}>{l.replace(/^https?:\/\//, "")} ↗</a>)}</div>}
          <span className={`chip ${u.openToWork ? "ok" : ""}`} style={{ justifySelf: "start" }}>{u.openToWork ? "Open to work" : "Not currently looking"}</span>
          {viewer.role !== "BUILDER" && <Link href="/briefs/new" className="btn btn-primary">Invite via a brief <span className="ar">↗</span></Link>}
        </aside>
      </div>
    </div>
  );
}

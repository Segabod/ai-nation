import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, users, briefs, inquiries, registrations, helpLogs } from "@/src/db";
import { requireAdmin, ROLE_LABEL } from "@/src/lib/auth";
import { adminSetBriefStatus, adminSetRole, adminToggleInquiry, adminToggleSuspend } from "@/app/actions/admin";
import { STATUS_CHIP, pretty } from "@/src/lib/constants";

export const metadata = { title: "Admin console" };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export default async function Admin() {
  const me = await requireAdmin();
  const [allUsers, allBriefs, allInq, allReg, helps] = await Promise.all([
    db.query.users.findMany({ orderBy: desc(users.createdAt), limit: 200, columns: { passwordHash: false } }),
    db.query.briefs.findMany({ orderBy: desc(briefs.createdAt), limit: 200, with: { owner: { columns: { name: true, organisation: true } }, interests: { columns: { id: true } } } }),
    db.query.inquiries.findMany({ orderBy: desc(inquiries.createdAt), limit: 200 }),
    db.query.registrations.findMany({ orderBy: desc(registrations.createdAt), limit: 500 }),
    db.query.helpLogs.findMany({ orderBy: desc(helpLogs.createdAt), limit: 100 }),
  ]);
  const pending = allBriefs.filter((b) => b.status === "PENDING");

  return (
    <div className="page wrap stack" style={{ gap: 22 }}>
      <div className="page-head">
        <div><p className="eyebrow o">Administrator</p><h1>Admin console</h1><p>Review briefs, manage members and roles, and follow up on messages and Open House registrations.</p></div>
        <nav className="row"><a className="chip" href="#briefs">Briefs ({pending.length} pending)</a><a className="chip" href="#users">Members ({allUsers.length})</a><a className="chip" href="#inbox">Inbox ({allInq.filter((q) => !q.handled).length})</a><a className="chip" href="#openhouse">Open House ({allReg.length})</a><a className="chip" href="#help">Help questions ({helps.length})</a></nav>
      </div>

      <section className="card stack" id="briefs">
        <h2>Briefs</h2>
        {allBriefs.length === 0 ? <p className="empty">No briefs yet.</p> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Brief</th><th>Owner</th><th>Status</th><th>Apps</th><th>Moderate</th></tr></thead>
            <tbody>{allBriefs.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/briefs/${b.id}`} style={{ fontWeight: 600 }}>{b.title}</Link><div className="dim" style={{ fontSize: 13 }}>{b.sector} · {fmt(b.createdAt)}</div></td>
                <td>{b.owner.organisation ?? b.owner.name}</td>
                <td><span className={`chip ${STATUS_CHIP[b.status]}`}>{pretty(b.status)}</span></td>
                <td>{b.interests.length}</td>
                <td><div className="row">
                  {b.status === "PENDING" ? (["OPEN", "REJECTED"] as const).map((s) => (
                    <form key={s} action={adminSetBriefStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value={s} />
                      <button className={`btn btn-sm ${s === "OPEN" ? "btn-primary" : "btn-danger"}`}>{s === "OPEN" ? "Approve" : "Reject"}</button></form>
                  )) : (
                    <form action={adminSetBriefStatus} className="row"><input type="hidden" name="id" value={b.id} />
                      <select name="status" className="select" defaultValue={b.status} style={{ width: 150, padding: "6px 10px" }} aria-label="Brief status">
                        {["PENDING", "OPEN", "IN_PROGRESS", "CLOSED", "REJECTED"].map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
                      </select><button className="btn btn-ghost btn-sm">Set</button></form>
                  )}
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card stack" id="users">
        <h2>Members</h2>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Member</th><th>Joined</th><th>Role</th><th>Access</th></tr></thead>
          <tbody>{allUsers.map((u) => (
            <tr key={u.id}>
              <td><b>{u.name}</b>{u.suspended && <span className="chip bad" style={{ marginLeft: 8 }}>Suspended</span>}<div className="dim" style={{ fontSize: 13 }}>{u.email}{u.organisation ? ` · ${u.organisation}` : ""}</div></td>
              <td>{fmt(u.createdAt)}</td>
              <td>{u.id === me.id ? <span className="chip orange">{ROLE_LABEL[u.role]} (you)</span> : (
                <form action={adminSetRole} className="row"><input type="hidden" name="id" value={u.id} />
                  <select name="role" className="select" defaultValue={u.role} style={{ width: 170, padding: "6px 10px" }} aria-label={`Role for ${u.name}`}>
                    {(["BUILDER", "ORGANISATION", "PARTNER", "ADMIN"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select><button className="btn btn-ghost btn-sm">Save</button></form>
              )}</td>
              <td>{u.id !== me.id && (
                <form action={adminToggleSuspend}><input type="hidden" name="id" value={u.id} />
                  <button className={`btn btn-sm ${u.suspended ? "btn-ghost" : "btn-danger"}`}>{u.suspended ? "Restore" : "Suspend"}</button></form>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>

      <section className="card stack" id="inbox">
        <h2>Inbox</h2>
        {allInq.length === 0 ? <p className="empty">No messages yet.</p> : (
          <div className="list">{allInq.map((q) => (
            <article key={q.id} className="item stack" style={{ gap: 8, opacity: q.handled ? 0.6 : 1 }}>
              <div className="between">
                <div className="row"><span className="chip blue">{q.topic}</span><b>{q.name}</b><a className="linkish" href={`mailto:${q.email}`}>{q.email}</a></div>
                <div className="row"><span className="dim" style={{ fontSize: 13 }}>{fmt(q.createdAt)}</span>
                  <form action={adminToggleInquiry}><input type="hidden" name="id" value={q.id} /><button className="btn btn-ghost btn-sm">{q.handled ? "Reopen" : "Mark handled"}</button></form></div>
              </div>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14.5 }}>{q.message}</p>
            </article>
          ))}</div>
        )}
      </section>

      <section className="card stack" id="openhouse">
        <div className="between"><h2>Open House registrations</h2>
          {allReg.length > 0 && <a className="btn btn-ghost btn-sm" href="/api/admin/registrations.csv">Download CSV</a>}</div>
        {allReg.length === 0 ? <p className="empty">No registrations yet.</p> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Name</th><th>Attending as</th><th>Organisation</th><th>Note</th><th>Date</th></tr></thead>
            <tbody>{allReg.map((r) => (
              <tr key={r.id}><td><b>{r.name}</b><div className="dim" style={{ fontSize: 13 }}>{r.email}</div></td><td>{r.attendAs}</td><td>{r.organisation ?? ""}</td><td style={{ maxWidth: 280 }}>{r.note ?? ""}</td><td>{fmt(r.createdAt)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card stack" id="help">
        <h2>Help questions</h2>
        <p className="muted" style={{ fontSize: 14.5 }}>The latest 100 questions asked to the help assistant. Repeated questions are a good sign the site needs clearer wording.</p>
        {helps.length === 0 ? <p className="empty">No questions yet.</p> : (
          <div className="list">{helps.map((q) => (
            <details key={q.id} className="item">
              <summary style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: 600 }}>{q.question}</span>
                <span className="dim" style={{ fontSize: 13, marginLeft: 8 }}>{(q.role ?? "GUEST").toLowerCase()} · {q.page ?? ""} · {fmt(q.createdAt)}{q.source !== "ai" ? ` · ${q.source}` : ""}</span>
              </summary>
              <p className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 10 }}>{q.answer}</p>
            </details>
          ))}</div>
        )}
      </section>
    </div>
  );
}

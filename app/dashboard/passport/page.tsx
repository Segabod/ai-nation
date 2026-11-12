import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, projects, projectFiles } from "@/src/db";
import { asc } from "drizzle-orm";
import EvidenceFiles from "@/src/components/EvidenceFiles";
import EvidenceUploader from "@/src/components/EvidenceUploader";
import { EVIDENCE_MAX_FILES, blobAccess, evidencePrefix, uploadsEnabled } from "@/src/lib/evidence";
import { requireUser } from "@/src/lib/auth";
import SmartForm from "@/src/components/SmartForm";
import { addProject, deleteProject, removeEvidence, updateProfile } from "@/app/actions/app";

export const metadata = { title: "Skills Passport" };
export const dynamic = "force-dynamic";

export default async function Passport({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const isBuilder = user.role === "BUILDER";
  const projs = isBuilder ? await db.query.projects.findMany({ where: eq(projects.userId, user.id), orderBy: desc(projects.createdAt), with: { files: { orderBy: asc(projectFiles.createdAt) } } }) : [];
  const canUpload = uploadsEnabled() && Boolean(user.emailVerifiedAt);

  return (
    <div className="stack">
      {welcome && <p className="notice ok">Welcome, {user.name.split(" ")[0]}. Start your passport with a headline, your skills and one project you’re proud of.</p>}
      <div className="page-head" style={{ marginBottom: 6 }}>
        <div>
          <p className="eyebrow o">{isBuilder ? "Builder Skills Passport" : "Your profile"}</p>
          <h1>{isBuilder ? "A résumé tells a story. Your work adds evidence." : "Profile"}</h1>
        </div>
        {isBuilder && <Link href={`/talent/${user.id}`} className="btn btn-ghost btn-sm">Preview what organisations see</Link>}
      </div>

      <div className={isBuilder ? "grid-2" : ""}>
        <div className="card">
          <h2>About you</h2>
          <p className="muted" style={{ marginBottom: 16, fontSize: 14.5 }}>{isBuilder ? "Shown to organisations reviewing your interest." : "Shown to builders on your briefs."}</p>
          <SmartForm
            action={updateProfile}
            submit="Save profile"
            variant="blue"
            fields={[
              { name: "name", label: "Full name", required: true, defaultValue: user.name },
              { name: "headline", label: "Headline", required: isBuilder, maxLength: 140, defaultValue: user.headline ?? "", placeholder: isBuilder ? "e.g. Final-year CS student building retrieval tools" : "e.g. Head of Operations" },
              ...(isBuilder ? [{ name: "organisation", label: "School or community", required: true, defaultValue: user.organisation ?? "", help: "Links you to your campus or community partner." }] : []),
              { name: "location", label: "Location", required: isBuilder, defaultValue: user.location ?? "" },
              { name: "bio", type: "textarea" as const, label: "Short bio", required: isBuilder, maxLength: 1500, defaultValue: user.bio ?? "" },
              ...(isBuilder ? [
                { name: "skills", label: "Skills", required: true, defaultValue: user.skills.join(", "), help: "Comma separated, e.g. Python, RAG, React, UX research" },
                { name: "links", label: "Links", required: true, defaultValue: user.links.join(", "), help: "GitHub, portfolio, LinkedIn. Comma separated, full https:// links." },
                { name: "openToWork", type: "checkbox" as const, label: "Show me in the talent directory as open to work", defaultValue: user.openToWork ? "on" : "" },
              ] : []),
            ]}
          />
        </div>

        {isBuilder && (
          <div className="stack" style={{ alignContent: "start" }}>
            <div className="card">
              <h2>Add a project</h2>
              <p className="muted" style={{ marginBottom: 16, fontSize: 14.5 }}>A capstone, a hackathon build or an independent project. Your contribution matters more than the prize.</p>
              <SmartForm
                action={addProject}
                submit="Add to passport"
                resetOnSuccess
                fields={[
                  { name: "title", label: "Project title", required: true, maxLength: 120 },
                  { name: "context", type: "textarea", label: "Project context", required: true, maxLength: 1500, placeholder: "The problem, the setting (course, hackathon, client) and the outcome." },
                  { name: "contribution", type: "textarea", label: "Your individual contribution", required: true, maxLength: 1500, placeholder: "What you personally built or decided, and what you changed when the first approach didn’t work." },
                  { name: "stack", label: "Tools and stack", required: true, help: "Comma separated" },
                  { name: "url", type: "url", label: "Link to demo or repo", required: true, placeholder: "https://" },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {isBuilder && (
        <div className="card stack">
          <h2>Evidence ({projs.length})</h2>
          {projs.length === 0 ? <p className="empty">No projects yet. Add your first one above.</p> : (
            <div className="grid-2">
              {projs.map((p) => (
                <article key={p.id} className="item stack" style={{ gap: 10 }}>
                  <div className="between">
                    <h3 style={{ margin: 0 }}>{p.title}</h3>
                    <form action={deleteProject}><input type="hidden" name="id" value={p.id} /><button className="btn btn-danger btn-sm">Remove</button></form>
                  </div>
                  <p className="muted" style={{ fontSize: 14.5 }}>{p.context}</p>
                  <p style={{ fontSize: 14.5 }}><b style={{ color: "var(--orange)" }}>My contribution: </b>{p.contribution}</p>
                  <div className="tags">{p.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="linkish">View project ↗</a>}
                  <EvidenceFiles files={p.files} remove={removeEvidence} />
                  {canUpload ? (
                    <EvidenceUploader projectId={p.id} prefix={evidencePrefix(user.id, p.id)} access={blobAccess()} remaining={EVIDENCE_MAX_FILES - p.files.length} />
                  ) : (
                    <small className="dim">{uploadsEnabled() ? "Confirm your email to attach screenshots, slides or PDFs." : "File attachments are coming soon."}</small>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

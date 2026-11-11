import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, briefs, interests } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";
import SmartForm from "@/src/components/SmartForm";
import { expressInterest } from "@/app/actions/app";
import { STATUS_CHIP, pretty } from "@/src/lib/constants";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const b = await db.query.briefs.findFirst({
    where: eq(briefs.id, id),
    with: { owner: { columns: { organisation: true, name: true, id: true } } },
  });
  // Only open/in-progress briefs are public; owners and admins can always see theirs
  const isOwner = user && (user.id === b?.ownerId || user.role === "ADMIN");
  if (!b || (!["OPEN", "IN_PROGRESS"].includes(b.status) && !isOwner)) notFound();

  const mine = user?.role === "BUILDER"
    ? await db.query.interests.findFirst({ where: and(eq(interests.briefId, b.id), eq(interests.userId, user.id)) })
    : null;

  return (
    <div className="page wrap">
      <Link href="/briefs" className="linkish">← All briefs</Link>
      <div className="grid-side" style={{ marginTop: 20 }}>
        <article className="card stack">
          <div className="row">
            <span className="chip blue">{b.sector}</span>
            <span className="chip">{b.engagement}</span>
            <span className={`chip ${STATUS_CHIP[b.status]}`}>{pretty(b.status)}</span>
            {b.isSample && <span className="chip orange">Sample</span>}
          </div>
          {b.isSample && (
            <p className="notice info">
              This is a sample brief. It shows what a real brief on AI Nation looks like; the organisation and budget are illustrative, and it isn’t open for applications.
            </p>
          )}
          <h1 style={{ fontSize: "clamp(30px,3.6vw,44px)" }}>{b.title}</h1>
          <p className="dim">{b.owner.organisation ?? "AI Nation partner"}{b.budget ? ` · Budget: ${b.budget}` : ""}</p>
          <div><p className="eyebrow" style={{ marginBottom: 8 }}>The need</p><p style={{ whiteSpace: "pre-wrap" }}>{b.summary}</p></div>
          <div><p className="eyebrow o" style={{ marginBottom: 8 }}>What success looks like</p><p style={{ whiteSpace: "pre-wrap" }}>{b.outcomes}</p></div>
          <p className="notice info">Scope, data access and success criteria are agreed with the organisation before any delivery begins.</p>
        </article>

        <aside className="card stack">
          {b.isSample ? (
            <>
              <h2>How this brief works</h2>
              <p className="muted">On a real brief, builders send a short note on why they’re a fit, and the organisation sees it alongside their Skills Passport.</p>
              <ol className="muted" style={{ paddingLeft: 18, display: "grid", gap: 6, fontSize: 14.5 }}>
                <li>Builders express interest with a short note.</li>
                <li>The organisation shortlists from passports and notes.</li>
                <li>A short call, then the team starts with a named reviewer.</li>
              </ol>
              {user?.role === "ORGANISATION" || user?.role === "ADMIN" ? (
                <Link href={`/briefs/new?sector=${encodeURIComponent(b.sector)}`} className="btn btn-primary">Publish a real brief like this <span className="ar">↗</span></Link>
              ) : user?.role === "BUILDER" ? (
                <Link href="/dashboard/passport" className="btn btn-primary">Get my passport ready <span className="ar">↗</span></Link>
              ) : (
                <>
                  <Link href="/signup?role=builder" className="btn btn-primary">Join as a builder <span className="ar">↗</span></Link>
                  <Link href="/employers" className="linkish">I want to publish a brief →</Link>
                </>
              )}
            </>
          ) : isOwner ? (
            <>
              <h2>You own this brief</h2>
              <p className="muted">Review interest from builders and manage status from your dashboard.</p>
              <Link href={`/dashboard/briefs/${b.id}`} className="btn btn-blue">Manage brief <span className="ar">↗</span></Link>
            </>
          ) : !user ? (
            <>
              <h2>Interested in this work?</h2>
              <p className="muted">Create a free builder account to express interest and share your Skills Passport.</p>
              <Link href="/signup?role=builder" className="btn btn-primary">Join as a builder <span className="ar">↗</span></Link>
              <Link href={`/login?next=/briefs/${b.id}`} className="linkish">I already have an account</Link>
            </>
          ) : user.role !== "BUILDER" ? (
            <>
              <h2>Builders only</h2>
              <p className="muted">Interest is submitted by builders. Publish a brief of your own, or invite your community to join.</p>
              <Link href="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
            </>
          ) : mine ? (
            <>
              <h2>You’ve expressed interest</h2>
              <p><span className={`chip ${STATUS_CHIP[mine.status]}`}>{pretty(mine.status)}</span></p>
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{mine.pitch}</p>
              <Link href="/dashboard" className="linkish">Track it in your dashboard →</Link>
            </>
          ) : b.status !== "OPEN" ? (
            <p className="muted">This brief is no longer accepting interest.</p>
          ) : (
            <>
              <h2>Express interest</h2>
              <p className="muted" style={{ fontSize: 14.5 }}>Share what you’d bring. The organisation will see this note and your Skills Passport.</p>
              <SmartForm
                action={expressInterest}
                submit="Send my interest"
                fields={[
                  { name: "briefId", type: "hidden", defaultValue: b.id },
                  { name: "pitch", type: "textarea", label: "Why you’re a fit", required: true, maxLength: 2000, placeholder: "Relevant projects, your role in them, and how you’d approach this brief." },
                ]}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

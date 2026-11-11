import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import Photo from "@/src/components/Photo";
import { Reveal, TypedSession } from "@/src/components/Landing";
import { db, briefs } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "For builders",
  description: "Turn a hackathon build or campus project into evidence, feedback and paid work with a Skills Passport.",
};

export default async function Builders() {
  const user = await getCurrentUser();
  const isBuilder = user?.role === "BUILDER";
  const startHref = isBuilder ? "/dashboard/passport" : user ? "/dashboard" : "/signup?role=builder";
  const openBriefs = await db.query.briefs.findMany({
    where: eq(briefs.status, "OPEN"), orderBy: desc(briefs.createdAt), limit: 3,
    with: { owner: { columns: { organisation: true } } },
  });

  return (
    <>
      <Reveal />
      {/* HERO */}
      <section className="wrap emp-hero">
        <div className="emp-hero-copy">
          <p className="eyebrow o">For builders</p>
          <h1>Your work is the <span className="grad">résumé.</span></h1>
          <p className="lede">
            A hackathon prize or a great campus project should be a beginning. Show what you built, explain how you built it,
            and get matched to paid briefs, placements and teams.
          </p>
          <div className="hero-ctas">
            <Link href={startHref} className="btn btn-primary">{isBuilder ? "Open my passport" : "Start my Skills Passport"} <span className="ar">↗</span></Link>
            <Link href="/briefs" className="btn btn-ghost">See open briefs <span aria-hidden>→</span></Link>
          </div>
          <p className="dim" style={{ fontSize: 13.5, marginTop: 14 }}>Free for builders. Students, graduates and independent talent welcome.</p>
        </div>
        <div className="emp-hero-media">
          <Photo src="/neon.jpg" alt="Neon sign in a dark window reading Do Something Great" />
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="sec" style={{ paddingTop: 70 }}>
        <div className="wrap reveal">
          <div className="pillars emp-why">
            {[
              ["A record that proves it", "Your Skills Passport shows real projects, your own contribution and reviewed feedback."],
              ["Feedback that helps", "Explain your build and get specific notes on what to strengthen next."],
              ["Paid opportunities", "Apply to briefs from employers, placements and team engagements."],
              ["People worth meeting", "Demo your work at Open House to employers, founders and mentors."],
            ].map(([h, p], i) => (
              <div className="pillar" key={h}><b>0{i + 1}</b><h3>{h}</h3><p className="muted">{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="sec" id="journey" style={{ paddingTop: 30 }}>
        <div className="wrap journey">
          <div className="journey-sticky reveal">
            <p className="eyebrow">How it works for builders</p>
            <h2 style={{ fontSize: "clamp(34px,4.4vw,56px)", margin: "12px 0 16px" }}>Good work<br />opens doors.</h2>
            <p className="muted" style={{ maxWidth: 420 }}>Four steps from what you’ve built to where you could go next.</p>
            <Link href={startHref} className="btn btn-primary" style={{ marginTop: 26 }}>Map my starting point <span className="ar">↗</span></Link>
          </div>
          <div className="steps">
            {[
              ["Show us the work.", "A capstone, a hackathon build or an independent project. Your contribution matters more than the prize."],
              ["Go beyond the presentation.", "Walk through your thinking, technical choices and individual contribution."],
              ["Develop your next strength.", "Use targeted feedback and mentorship to close gaps and prepare for the work you want."],
              ["Make the right connection.", "Apply to paid briefs, team engagements or placements as they open."],
            ].map(([h, p], i) => (
              <div className="step reveal" key={h}><b>0{i + 1}</b><div><h3>{h}</h3><p className="muted">{p}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* PASSPORT */}
      <section className="sec" id="passport">
        <div className="wrap passport reveal">
          <div className="pp-copy">
            <p className="eyebrow o">The Builder Skills Passport</p>
            <h2>A résumé tells a story. Your work adds evidence.</h2>
            <p className="muted">Project context. Individual contributions. Reviewed feedback. A record that helps employers understand what you can bring to a team.</p>
            <p style={{ marginTop: 16, fontFamily: "var(--display)" }}>Voice or text. Human review. Room to grow.</p>
            <Link href={startHref} className="btn btn-light" style={{ marginTop: 26 }}>
              {isBuilder ? "Open my passport" : "Start my passport"} <span className="ar">↗</span>
            </Link>
          </div>
          <TypedSession />
        </div>
      </section>

      {/* BRIEFS */}
      <section className="sec" id="briefs" style={{ paddingTop: 20 }}>
        <div className="wrap reveal">
          <div className="between" style={{ marginBottom: 18 }}>
            <div><p className="eyebrow">Paid work you can apply for</p><h2 style={{ fontSize: "clamp(30px,3.6vw,46px)", marginTop: 12 }}>Open briefs right now</h2></div>
            <Link href="/briefs" className="linkish">See all briefs →</Link>
          </div>
          {openBriefs.length > 0 ? (
            <div className="grid-3">
              {openBriefs.map((b) => (
                <Link key={b.id} href={`/briefs/${b.id}`} className="item">
                  <div className="row"><span className="chip blue">{b.sector}</span>{b.isSample && <span className="chip orange">Sample</span>}</div>
                  <h3>{b.title}</h3>
                  <p className="muted" style={{ fontSize: 14 }}>{b.owner.organisation ?? "AI Nation partner"} · {b.engagement}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card">
              <h3 style={{ fontSize: 20 }}>New briefs are on the way.</h3>
              <p className="muted" style={{ marginTop: 8 }}>Start your passport now so you’re ready to apply the day they open. We’ll match you on your evidence, not your network.</p>
            </div>
          )}
        </div>
      </section>

      {/* OPEN HOUSE */}
      <section className="sec" id="open-house" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="openhouse reveal">
            <Photo src="/event.jpg" alt="A builder in an AI shirt talking with a student at a busy campus showcase" />
            <div className="oh-top"><span>AI NATION PRESENTS</span><span>CONCEPT EDITION</span></div>
            <div className="oh-in">
              <div><p className="eyebrow o">Demo your work</p><h2>Open<br /><span>house.</span></h2></div>
              <div>
                <p style={{ fontFamily: "var(--display)", fontSize: 22 }}>Show what you built to the people who hire.</p>
                <p className="muted" style={{ marginTop: 10 }}>Demo a working project and meet employers, founders and potential clients face to face.</p>
                <Link href="/open-house#register" className="btn btn-primary" style={{ marginTop: 20 }}>Register to demo <span className="ar">↗</span></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="closing" id="closing">
        <div className="wrap reveal">
          <p className="eyebrow o">Start today</p>
          <h2>Bring one project. We’ll help you take it further.</h2>
          <p className="muted" style={{ fontSize: 19 }}>It takes about ten minutes to start a passport.</p>
          <div className="row">
            <Link href={startHref} className="btn btn-primary">{isBuilder ? "Open my passport" : "Join as a builder"} <span className="ar">↗</span></Link>
            <Link href="/contact" className="btn btn-ghost">Ask us a question</Link>
          </div>
        </div>
      </section>
    </>
  );
}

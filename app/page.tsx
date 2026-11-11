import Photo from "@/src/components/Photo";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, briefs } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";
import { BriefShowcase, Reveal, TypedSession } from "@/src/components/Landing";
import SmartForm from "@/src/components/SmartForm";
import { sendPartnership } from "@/app/actions/app";
import { PARTNER_TYPES, PARTNER_WAYS, opts } from "@/src/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const openBriefs = await db.query.briefs.findMany({
    where: eq(briefs.status, "OPEN"), orderBy: desc(briefs.createdAt), limit: 3,
    with: { owner: { columns: { organisation: true } } },
  });

  // Every CTA lands somewhere real; signed-in users go straight to the relevant workspace.
  const builderHref = user ? (user.role === "BUILDER" ? "/dashboard/passport" : "/dashboard") : "/signup?role=builder";
  const orgHref = user ? (user.role === "ORGANISATION" || user.role === "ADMIN" ? "/talent" : "/dashboard") : "/signup?role=organisation";
  const partnerHref = user ? (user.role === "PARTNER" ? "/dashboard/community" : "/dashboard") : "/signup?role=partner";

  return (
    <>
      <Reveal />
      {/* HERO */}
      <section className="hero" id="top">
        <div className="glow" style={{ width: 420, height: 420, background: "#0b67c9", left: -120, top: -60 }} />
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow o">Exceptional talent. A community of possibility.</p>
            <h1>Great builders finding their next <span className="grad">big opportunity.</span></h1>
            <p className="lede">Connecting university, college and hackathon talent with organisations ready to build something meaningful.</p>
            <div className="hero-ctas">
              <Link href={builderHref} className="btn btn-primary">Explore my pathway <span className="ar">↗</span></Link>
              <Link href={orgHref} className="btn btn-ghost">Find talent for my team <span aria-hidden>→</span></Link>
            </div>
          </div>
          <div className="hero-media">
            <Photo src="/lights.jpg" alt="Visitors in silhouette walking through a room of hanging lights" />
            <div className="hero-badge">
              <span className="chip">Discover · Develop · Connect</span>
              <Link href="/briefs" className="chip blue">{openBriefs.length ? `${openBriefs.length}+ open briefs` : "Browse briefs"} ↗</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="sec" style={{ paddingTop: 30 }}>
        <div className="wrap reveal">
          <p className="eyebrow">Discover. Develop. Connect.</p>
          <div className="pillars" style={{ marginTop: 22 }}>
            {[
              ["01", "Show your work", "Projects that demonstrate your ability"],
              ["02", "Build your skills", "Focused feedback and mentorship"],
              ["03", "Find your fit", "A path toward paid opportunities"],
            ].map(([n, h, p]) => (
              <div className="pillar" key={n}><b>{n}</b><h3>{h}</h3><p className="muted">{p}</p></div>
            ))}
          </div>
          <p className="statement">A hackathon prize or a great campus project should be a <em>beginning.</em> We’re creating a path from demonstrated potential to meaningful, paid work.</p>
        </div>
      </section>

      {/* PATHS */}
      <section className="sec" id="paths">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><p className="eyebrow">Choose your starting point</p><h2>Talent meets possibility.</h2></div>
            <p>We connect people who can build with organisations ready to turn ambition into useful work.</p>
          </div>
          <div className="paths reveal">
            <Link href={builderHref} className="path">
              <span className="go" aria-hidden>↗</span>
              <span className="ic" aria-hidden>⌘</span>
              <h3>I’m a builder.</h3>
              <span className="who">Students, graduates &amp; independent talent</span>
              <p className="muted">Bring your work. Explore focused feedback, development and a path toward paid opportunity.</p>
            </Link>
            <Link href={orgHref} className="path o">
              <span className="go" aria-hidden>↗</span>
              <span className="ic" aria-hidden>↗</span>
              <h3>I need a team.</h3>
              <span className="who">Startups, businesses &amp; nonprofits</span>
              <p className="muted">Explore assessed talent, embedded teams and managed projects around a defined business need.</p>
            </Link>
            <Link href={partnerHref} className="path">
              <span className="go" aria-hidden>↗</span>
              <span className="ic" aria-hidden>+</span>
              <h3>I connect people.</h3>
              <span className="who">Campuses, communities &amp; innovation hubs</span>
              <p className="muted">Explore how your community’s talent could connect with practical projects and meaningful work.</p>
            </Link>
          </div>
          <p className="statement reveal">Your best work deserves more than applause. <em>It deserves a next step.</em></p>
        </div>
      </section>

      {/* BRIEFS */}
      <section className="sec" id="work">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><p className="eyebrow o">The possibility journal / 01</p><h2>Useful work.<br />Worth building.</h2></div>
            <p>What could a focused team make possible? Explore illustrative project briefs across everyday business challenges.</p>
          </div>
          <div className="reveal"><BriefShowcase /></div>

          {openBriefs.length > 0 && (
            <div className="reveal" style={{ marginTop: 40 }}>
              <div className="between" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 24 }}>Open briefs right now</h3>
                <Link href="/briefs" className="linkish">See all briefs →</Link>
              </div>
              <div className="grid-3">
                {openBriefs.map((b) => (
                  <Link key={b.id} href={`/briefs/${b.id}`} className="item">
                    <span className="chip blue">{b.sector}</span>
                    <h3>{b.title}</h3>
                    <p className="muted" style={{ fontSize: 14 }}>{b.owner.organisation ?? "AI Nation partner"} · {b.engagement}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* JOURNEY */}
      <section className="sec" id="approach">
        <div className="wrap journey">
          <div className="journey-sticky reveal">
            <p className="eyebrow">How the connection happens</p>
            <h2 style={{ fontSize: "clamp(36px,4.6vw,60px)", margin: "12px 0 16px" }}>Good work<br />opens doors.</h2>
            <p className="muted" style={{ maxWidth: 420 }}>A practical journey from what you’ve built to where you could go next.</p>
            <Link href={builderHref} className="btn btn-primary" style={{ marginTop: 26 }}>Map my starting point <span className="ar">↗</span></Link>
          </div>
          <div className="steps">
            {[
              ["01", "Show us the work.", "A capstone, a hackathon build or an independent project. Your contribution matters more than the prize."],
              ["02", "Go beyond the presentation.", "Walk through your thinking, technical choices and individual contribution. Build a clearer picture of your capability."],
              ["03", "Develop your next strength.", "Use targeted feedback and practical mentorship to close gaps and prepare for the work you want to do."],
              ["04", "Make the right connection.", "Explore suitable paid projects, team engagements or employment as funded opportunities become available."],
            ].map(([n, h, p]) => (
              <div className="step reveal" key={n}><b>{n}</b><div><h3>{h}</h3><p className="muted">{p}</p></div></div>
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
            <p className="muted">Project context. Individual contributions. Reviewed feedback. A record that helps people understand what you can bring to a team.</p>
            <p style={{ marginTop: 16, fontFamily: "var(--display)" }}>Voice or text. Human review. Room to grow.</p>
            <Link href={builderHref} className="btn btn-light" style={{ marginTop: 26 }}>
              {user?.role === "BUILDER" ? "Open my passport" : "Start my passport"} <span className="ar">↗</span>
            </Link>
          </div>
          <TypedSession />
        </div>
      </section>

      {/* OPEN HOUSE */}
      <section className="sec" id="open-house">
        <div className="wrap">
          <div className="openhouse reveal">
            <Photo src="/event.jpg" alt="A builder in an AI shirt talking with a student at a busy campus showcase" />
            <div className="oh-top"><span>AI NATION PRESENTS</span><span>CONCEPT EDITION</span></div>
            <div className="oh-in">
              <div>
                <p className="eyebrow o">An open floor for possibility</p>
                <h2>Open<br /><span>house.</span></h2>
              </div>
              <div>
                <p style={{ fontFamily: "var(--display)", fontSize: 22 }}>Come for the work. Stay for the people.</p>
                <ul className="oh-list"><li>Live demonstrations.</li><li>The people behind the work.</li><li>The conversation that comes next.</li></ul>
                <p className="muted" style={{ marginTop: 14 }}>A proposed showcase where builders demonstrate working projects and meet employers, founders and potential clients.</p>
                <Link href="/open-house#register" className="btn btn-primary" style={{ marginTop: 20 }}>Plan my participation <span className="ar">↗</span></Link>
                <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>Programme in development. No event date confirmed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="sec" id="ecosystem" style={{ paddingBottom: 30 }}>
        <div className="wrap sec-head reveal">
          <div><p className="eyebrow">Built through connection</p><h2>One ecosystem, many ways in.</h2></div>
          <p>We’re developing a model that connects campus talent, builder communities and organisations with funded needs.</p>
        </div>
        <div className="marquee" aria-label="Universities and colleges, hackathon communities, innovation hubs, employers and founders">
          <div className="marquee-track" aria-hidden>
            {[0, 1].flatMap((r) => ["Universities & colleges", "Hackathon communities", "Innovation hubs", "Employers & founders"].map((t) => <span key={r + t}>{t}</span>))}
          </div>
        </div>
      </section>

      {/* PARTNER WITH US */}
      <section className="sec" id="partner">
        <div className="wrap partner reveal">
          <div className="partner-copy">
            <p className="eyebrow o">Partner with us</p>
            <h2>Build the bridge with us.</h2>
            <p className="muted">
              Hackathons, campus zones, incubators, advisory firms and employers each hold one part of the path from potential to paid work.
              Partner with AI Nation and we’ll connect the rest.
            </p>
            <ul className="partner-ways">
              <li>
                <b>Talent sources</b>
                <span>Hackathons, universities and builder communities. Give your best builders a next step after the demo, with a Skills Passport and a route to paid briefs.</span>
              </li>
              <li>
                <b>Demand partners</b>
                <span>Incubators, advisory firms, startups and employers. Bring scoped problems and get assessed builders, embedded teams or managed projects.</span>
              </li>
              <li>
                <b>Ecosystem hosts</b>
                <span>Innovation hubs, summits and funders. Host an Open House, co-run a challenge track or fund placements, and see the outcomes.</span>
              </li>
            </ul>
            <p className="dim" style={{ fontSize: 13.5 }}>We start every partnership with one small pilot before anything formal.</p>
          </div>
          <div className="card partner-card" id="partner-form">
            <h3 style={{ fontSize: 22 }}>Start a partnership conversation</h3>
            <p className="muted" style={{ margin: "6px 0 18px", fontSize: 14.5 }}>Takes a minute. We reply within two working days.</p>
            <SmartForm
              action={sendPartnership}
              submit="Send partnership request"
              resetOnSuccess
              fields={[
                { name: "name", label: "Your name", required: true, autoComplete: "name", defaultValue: user?.name ?? "", half: true },
                { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email", defaultValue: user?.email ?? "", half: true },
                { name: "organisation", label: "Organisation", required: true, autoComplete: "organization", maxLength: 140, defaultValue: user?.organisation ?? "", half: true },
                { name: "website", label: "Website", type: "url", placeholder: "https://", maxLength: 300, half: true },
                { name: "partnerType", type: "select", label: "Your organisation is a", required: true, options: opts(PARTNER_TYPES, "Choose one") },
                { name: "partnerWay", type: "select", label: "How you’d like to partner", required: true, options: opts(PARTNER_WAYS, "Choose one") },
                { name: "message", type: "textarea", label: "Anything we should know", maxLength: 2000, placeholder: "Your next event, a problem you’d like solved, or who you’d like to reach." },
                { name: "company_website", type: "hidden", defaultValue: "" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="closing" id="closing">
        <div className="wrap reveal">
          <p className="eyebrow o">Let’s talk</p>
          <h2>Your next chapter starts with a conversation.</h2>
          <p className="muted" style={{ fontSize: 19 }}>Bring your talent. Bring your challenge. Let’s find the right starting point.</p>
          <div className="row">
            <Link href={builderHref} className="btn btn-primary">I’m ready to build <span className="ar">↗</span></Link>
            <Link href="/employers" className="btn btn-ghost">I’m looking for talent <span aria-hidden>→</span></Link>
            <Link href="/#partner" className="btn btn-ghost">Partner with us</Link>
            <Link href="/contact" className="btn btn-ghost">Send us a message</Link>
          </div>
        </div>
      </section>
    </>
  );
}

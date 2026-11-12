import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, briefs } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { homeForRole } from "@/src/lib/audience";

export const dynamic = "force-dynamic";

// Paths travelled by the hero particles: builder -> Skills Passport -> organisation.
const IN = [
  "M70 100 C180 100 200 260 300 260",
  "M50 210 C170 210 200 260 300 260",
  "M80 320 C180 320 200 260 300 260",
  "M55 430 C180 430 200 260 300 260",
];
const OUT = [
  "M300 260 C400 260 420 130 530 130",
  "M300 260 C400 260 430 260 548 260",
  "M300 260 C400 260 420 390 530 390",
];
const BUILDERS: [number, number][] = [[70, 100], [50, 210], [80, 320], [55, 430]];
const ORGS: [number, number][] = [[530, 130], [548, 260], [530, 390]];
const TRIPS: { i: number; o: number; dur: string; begin: string; org?: boolean }[] = [
  { i: 0, o: 0, dur: "4.2s", begin: "0s" },
  { i: 1, o: 1, dur: "4.8s", begin: "-1.1s" },
  { i: 2, o: 2, dur: "4.4s", begin: "-2s" },
  { i: 3, o: 0, dur: "5s", begin: "-0.5s" },
  { i: 3, o: 1, dur: "5.4s", begin: "-2.8s", org: true },
];
const SOURCES = ["Hackathons", "Universities", "Colleges", "Builder communities", "Incubators", "Employers"];

export default async function Home({ searchParams }: { searchParams: Promise<{ choose?: string }> }) {
  const user = await getCurrentUser();
  // Signed-in members go straight to their own home; "/?choose=1" still shows this page.
  if (user && user.role !== "ADMIN" && !(await searchParams).choose) redirect(homeForRole(user.role));
  const open = await db.$count(briefs, eq(briefs.status, "OPEN"));

  return (
    <div className="hm">
      {/* HERO */}
      <section className="hm-hero hm-dots" id="top">
        <div className="wrap hm-hero-grid">
          <div className="hm-copy">
            <p className="eyebrow o hm-rise hm-d1">Campus talent · Real briefs</p>
            <h1 className="hm-rise hm-d2">Where builders<br />become <span className="hm-accent">hires.</span></h1>
            <p className="lede hm-rise hm-d3">
              AI Nation turns what students and hackathon teams build into a Skills Passport, then routes them to paid
              briefs from organisations that need the work done.
            </p>
            <div className="hm-ctas hm-rise hm-d4">
              <Link href="/builders" className="btn btn-primary">I’m a builder <span className="ar">↗</span></Link>
              <Link href="/employers" className="btn btn-ghost">I’m hiring</Link>
              <Link href="/briefs" className="linkish">{open > 0 ? `${open} open brief${open === 1 ? "" : "s"} →` : "Browse briefs →"}</Link>
            </div>
          </div>

          <div className="hm-visual hm-rise hm-d3">
            <svg viewBox="0 0 600 520" role="img" aria-label="Builders flow through a Skills Passport to organisations">
              <text x="40" y="36" className="hm-label">BUILDERS</text>
              <text x="560" y="36" className="hm-label" textAnchor="end">ORGANISATIONS</text>
              <g className="hm-line-b">{IN.map((d) => <path key={d} className="hm-flow" d={d} />)}</g>
              <g className="hm-line-o">{OUT.map((d) => <path key={d} className="hm-flow" d={d} />)}</g>
              <g className="hm-particles">
                {TRIPS.map((t, k) => (
                  <circle key={k} r={t.org ? 3 : 4} className={t.org ? "hm-fill-o" : "hm-fill-b"}>
                    <animateMotion dur={t.dur} begin={t.begin} repeatCount="indefinite" path={`${IN[t.i]} ${OUT[t.o].slice(OUT[t.o].indexOf("C"))}`} />
                  </circle>
                ))}
              </g>
              {BUILDERS.map(([x, y], k) => (
                <g key={`b${k}`}>
                  <circle className={`hm-pulse hm-p${k}`} cx={x} cy={y} r={7} />
                  <circle className="hm-fill-b" cx={x} cy={y} r={7} />
                </g>
              ))}
              {ORGS.map(([x, y], k) => <rect key={`o${k}`} className="hm-fill-o" x={x - 9} y={y - 9} width={18} height={18} rx={4} />)}
              <circle className="hm-spin-r hm-ring-1" cx="300" cy="260" r="112" />
              <circle className="hm-spin hm-ring-2" cx="300" cy="260" r="88" />
              <g className="hm-float">
                <rect className="hm-card" x="228" y="216" width="144" height="88" rx="12" />
                <text x="244" y="240" className="hm-card-t">SKILLS PASSPORT</text>
                {[[252, 72, "b"], [266, 54, "o"], [280, 84, "b"]].map(([y, w, c]) => (
                  <g key={y}>
                    <rect className="hm-track" x="244" y={y} width="112" height="6" rx="3" />
                    <rect className={c === "b" ? "hm-fill-b" : "hm-fill-o"} x="244" y={y} width={w} height="6" rx="3" />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* TALENT SOURCES */}
      <div className="hm-marquee" aria-label={SOURCES.join(", ")}>
        <div className="hm-track-x" aria-hidden>
          {[0, 1].flatMap((r) => SOURCES.map((s) => <span key={r + s}>{s}</span>))}
        </div>
      </div>

      {/* BUILD. PROVE. GET PAID. */}
      <section className="sec" id="how">
        <div className="wrap">
          <h2 className="hm-h2">Build. Prove. <span className="hm-accent">Get paid.</span></h2>
          <div className="hm-steps">
            <div className="hm-step">
              <div className="hm-anim hm-code" aria-hidden>
                <i className="hm-type hm-fill-b" style={{ ["--w" as string]: "78%" }} />
                <i className="hm-type hm-soft" style={{ ["--w" as string]: "54%", animationDelay: ".3s" }} />
                <i className="hm-type hm-soft" style={{ ["--w" as string]: "66%", animationDelay: ".6s" }} />
                <span><i className="hm-type hm-fill-o" style={{ ["--w" as string]: "40%", animationDelay: ".9s" }} /><b className="hm-caret">▍</b></span>
              </div>
              <span className="hm-num">01</span>
              <h3>Build</h3>
              <p className="muted">Ship something real at a hackathon, in class or on your own.</p>
            </div>
            <div className="hm-step">
              <div className="hm-anim hm-center" aria-hidden>
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle className="hm-spin hm-ring-2" cx="48" cy="48" r="42" strokeDasharray="14 8" />
                  <circle className="hm-card" cx="48" cy="48" r="30" />
                  <path className="hm-draw" d="M36 49 L45 58 L61 40" />
                </svg>
              </div>
              <span className="hm-num">02</span>
              <h3>Prove</h3>
              <p className="muted">Your build becomes a Skills Passport that shows what you can actually do.</p>
            </div>
            <div className="hm-step">
              <div className="hm-anim hm-brief" aria-hidden>
                <div className="between"><span className="hm-mono">BRIEF</span><span className="hm-paid">PAID</span></div>
                <div className="hm-bar"><i className="hm-grow" /></div>
                <i className="hm-soft" style={{ width: "60%", height: 8 }} />
              </div>
              <span className="hm-num">03</span>
              <h3>Get paid</h3>
              <p className="muted">Organisations post briefs. Passport holders take them on and get paid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="wrap hm-aud" aria-label="Choose your starting point">
        <Link href="/builders">
          <span className="eyebrow o">For builders</span>
          <b>Turn your demo into a door.</b>
          <span className="muted">Get your passport →</span>
        </Link>
        <Link href="/employers">
          <span className="eyebrow">For employers</span>
          <b>Hire from proof, not promises.</b>
          <span className="muted">Post a brief →</span>
        </Link>
        <Link href="/partners">
          <span className="eyebrow" style={{ color: "var(--ink)" }}>For partners</span>
          <b>Give your best builders a next step after the demo.</b>
          <span className="muted">Run a challenge track →</span>
        </Link>
      </section>

      {/* CLOSING */}
      <section className="closing hm-dots" id="join">
        <div className="wrap">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden style={{ margin: "0 auto" }}>
            <circle className="hm-pulse hm-p0" cx="32" cy="32" r="10" />
            <circle className="hm-pulse hm-p2" cx="32" cy="32" r="10" />
            <circle className="hm-fill-b" cx="32" cy="32" r="10" />
          </svg>
          <h2>Your next build could be <span className="hm-accent">someone’s next hire.</span></h2>
          <div className="row">
            <Link href="/signup" className="btn btn-primary">Join as a builder <span className="ar">↗</span></Link>
            <Link href="/employers" className="btn btn-ghost">Hire through AI Nation</Link>
            <Link href="/contact" className="btn btn-ghost">Send us a message</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

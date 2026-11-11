import Link from "next/link";
import Photo from "@/src/components/Photo";
import SmartForm from "@/src/components/SmartForm";
import { Reveal } from "@/src/components/Landing";
import { sendPartnership } from "@/app/actions/app";
import { PARTNER_TYPES, PARTNER_WAYS, opts } from "@/src/lib/constants";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = {
  title: "For partners",
  description: "Hackathons, campuses, incubators and innovation hubs: give your builders a next step after the demo, and see the outcomes.",
};

const WAYS = [
  {
    tag: "Talent sources", tone: "",
    who: "Hackathons, universities, colleges and builder communities",
    what: "Give your best builders a next step after the demo: a Skills Passport from their build and a route to paid briefs.",
    pilot: "Co-run one challenge track, or offer passports to your next cohort.",
  },
  {
    tag: "Demand partners", tone: "o",
    who: "Incubators, accelerators, advisory firms and their startups",
    what: "Bring scoped problems from your founders or clients and get assessed builders, embedded teams or managed projects.",
    pilot: "One sprint brief for one startup or client problem.",
  },
  {
    tag: "Ecosystem hosts", tone: "",
    who: "Innovation hubs, summits, funders and economic development offices",
    what: "Host an Open House, sponsor placements or fund a challenge, and get outcome numbers you can report on.",
    pilot: "One Open House or one funded challenge.",
  },
] as const;

export default async function Partners() {
  const user = await getCurrentUser();
  const isPartner = user?.role === "PARTNER";
  const toolsHref = isPartner ? "/dashboard/community" : user ? "/dashboard" : "/signup?role=partner";

  return (
    <>
      <Reveal />
      {/* HERO */}
      <section className="wrap emp-hero">
        <div className="emp-hero-copy">
          <p className="eyebrow o">For partners</p>
          <h1>Give your builders a <span className="grad">next step.</span></h1>
          <p className="lede">
            Hackathons, campus zones and innovation hubs create great talent. AI Nation turns the demo into evidence,
            feedback and paid work, and shows you the outcomes.
          </p>
          <div className="hero-ctas">
            <a href="#partner-form" className="btn btn-primary">Start a partnership <span className="ar">↗</span></a>
            <Link href={toolsHref} className="btn btn-ghost">{isPartner ? "Open my community" : "Register my community"} <span aria-hidden>→</span></Link>
          </div>
          <p className="dim" style={{ fontSize: 13.5, marginTop: 14 }}>Every partnership starts with one small pilot, before anything formal.</p>
        </div>
        <div className="emp-hero-media">
          <Photo src="/lights.jpg" alt="Visitors in silhouette walking through a room of hanging lights" />
        </div>
      </section>

      {/* WAYS TO PARTNER */}
      <section className="sec" id="ways" style={{ paddingTop: 70 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div><p className="eyebrow">Three ways to partner</p><h2>Each partner holds one part of the path.</h2></div>
            <p>Talent comes in from campuses and hackathons, problems come in from employers and incubators, and hosts bring them together.</p>
          </div>
          <div className="part-ways reveal">
            {WAYS.map((w) => (
              <article key={w.tag} className={`emp-option ${w.tone}`}>
                <span className={`chip ${w.tone === "o" ? "orange" : "blue"}`} style={{ justifySelf: "start" }}>{w.tag}</span>
                <h3 style={{ fontSize: 21 }}>{w.who}</h3>
                <p className="muted">{w.what}</p>
                <dl><div><dt>First pilot</dt><dd>{w.pilot}</dd></div></dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="sec" id="tools" style={{ paddingTop: 30 }}>
        <div className="wrap emp-subsidy">
          <div className="emp-subsidy-copy reveal">
            <p className="eyebrow o">Partner tools</p>
            <h2>See what happens after the demo.</h2>
            <p className="muted">
              Register your campus, hackathon or community and get a partner workspace. Builders who list you on their
              passport appear there, so you can see who is active and what they are applying for.
            </p>
            <Link href={toolsHref} className="btn btn-light" style={{ justifySelf: "start" }}>
              {isPartner ? "Open my community" : "Register my community"} <span className="ar">↗</span>
            </Link>
          </div>
          <div className="emp-subsidy-cards reveal">
            {[
              ["Your builders in one place", "Everyone who lists your campus or community on their Skills Passport, with their skills and headline."],
              ["Outcomes you can report", "How many of your builders are applying to briefs, so you can show funders and leadership the impact."],
              ["A sign-up link to share", "Send your cohort one link after the event so the next step is waiting for them."],
            ].map(([h, p]) => (
              <div className="emp-fund" key={h}><h3>{h}</h3><p className="muted">{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER FORM */}
      <section className="sec" id="partner">
        <div className="wrap partner reveal">
          <div className="partner-copy">
            <p className="eyebrow o">Partner with us</p>
            <h2>Build the bridge with us.</h2>
            <p className="muted">Tell us about your organisation and how you’d like to work together. We’ll suggest a first pilot on the call.</p>
            <ul className="partner-ways">
              <li><b>1. Intro call</b><span>Thirty minutes on your community, your goals and what you’d like to measure.</span></li>
              <li><b>2. One pilot</b><span>A challenge track, a cohort of passports, a sprint brief or an Open House.</span></li>
              <li><b>3. Shared results</b><span>Placements, applications and briefs delivered, in a short report you can share.</span></li>
            </ul>
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
    </>
  );
}

import Link from "next/link";
import Photo from "@/src/components/Photo";
import SmartForm from "@/src/components/SmartForm";
import { sendEmployerEnquiry } from "@/app/actions/app";
import { EMPLOYER_OPTIONS, EMPLOYER_SIZES, opts } from "@/src/lib/constants";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = {
  title: "For employers",
  description: "Work with assessed builders from universities, colleges and hackathons through challenges, sprint briefs, funded placements and talent pipelines.",
};

const OPTIONS = [
  {
    n: "01", name: "Challenge sponsor", tone: "",
    what: "Bring one real problem to a hackathon track or an Open House. Builder teams take it on and show you working ideas.",
    commit: "A 45 minute discovery call and a short pitch on the day.",
    good: "Testing an idea, meeting talent, low commitment.",
  },
  {
    n: "02", name: "Sprint brief", tone: "o",
    what: "A small builder team works on a scoped problem for 4 to 8 weeks, with an AI Nation lead reviewing the work.",
    commit: "A scoped brief, a weekly check in and a final review.",
    good: "A prototype, an internal tool or a proof of concept.",
  },
  {
    n: "03", name: "Embedded placement", tone: "",
    what: "A builder joins your team for a term as a co-op student, intern or contractor, matched on evidence of past work.",
    commit: "A supervisor, real work and a paid role.",
    good: "Extra capacity, often with a wage subsidy.",
  },
  {
    n: "04", name: "Talent pipeline partner", tone: "o",
    what: "A yearly partnership covering several briefs, priority access to the talent directory and a presence at Open House.",
    commit: "A planning call each term.",
    good: "Ongoing hiring and repeat projects.",
  },
] as const;

const STEPS = [
  ["Discovery call", "Thirty minutes to understand the problem, your data and what success looks like. No AI strategy needed."],
  ["Scoped brief", "We turn it into a short brief with outcomes, timeline, budget and engagement model, and agree it with you."],
  ["Build with review", "Builders are matched on their Skills Passport. A named reviewer checks the work and you see progress every week."],
  ["Handover and next step", "You keep what was built. Then decide whether to pilot it, extend the team or hire the builders."],
] as const;

export default async function Employers() {
  const user = await getCurrentUser();
  const briefHref = user ? (user.role === "ORGANISATION" || user.role === "ADMIN" ? "/briefs/new" : "/dashboard") : "/signup?role=organisation";

  return (
    <>
      {/* HERO */}
      <section className="wrap emp-hero">
        <div className="emp-hero-copy">
          <p className="eyebrow o">For employers</p>
          <h1>Hire on evidence, <span className="grad">not résumés.</span></h1>
          <p className="lede">
            Work with builders from universities, colleges and hackathons who have already shown what they can do.
            Start with one problem, keep what gets built, and hire when it fits.
          </p>
          <div className="hero-ctas">
            <a href="#enquire" className="btn btn-primary">Start a conversation <span className="ar">↗</span></a>
            <Link href={briefHref} className="btn btn-ghost">Publish a brief <span aria-hidden>→</span></Link>
          </div>
        </div>
        <div className="emp-hero-media">
          <Photo src="/event.jpg" alt="A builder in an AI shirt talking with a student at a busy campus showcase" />
        </div>
      </section>

      {/* WHY */}
      <section className="sec" style={{ paddingTop: 70 }}>
        <div className="wrap">
          <div className="pillars emp-why">
            {[
              ["Evidence of skill", "Every builder has a Skills Passport: real projects, their own contribution and reviewed feedback."],
              ["Capacity without a hire", "Get a scoped problem solved in weeks before you commit to a role."],
              ["Funded placements", "Eligible student placements can come with wage subsidies or tax credits."],
              ["A pipeline you trust", "See people work before you hire them, and meet strong graduates first."],
            ].map(([h, p], i) => (
              <div className="pillar" key={h}><b>0{i + 1}</b><h3>{h}</h3><p className="muted">{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* OPTIONS */}
      <section className="sec" id="options" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="sec-head">
            <div><p className="eyebrow">Four ways to work with us</p><h2>Start small. Grow with what works.</h2></div>
            <p>Most employers start as a challenge sponsor or with one sprint brief, then move to placements once they have seen the work.</p>
          </div>
          <div className="emp-options">
            {OPTIONS.map((o) => (
              <article key={o.n} className={`emp-option ${o.tone}`}>
                <div className="between"><span className="emp-n">{o.n}</span><span className={`chip ${o.tone === "o" ? "orange" : "blue"}`}>{o.n === "01" ? "Lightest" : o.n === "04" ? "Deepest" : "Engagement"}</span></div>
                <h3>{o.name}</h3>
                <p className="muted">{o.what}</p>
                <dl>
                  <div><dt>You commit</dt><dd>{o.commit}</dd></div>
                  <div><dt>Good for</dt><dd>{o.good}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SUBSIDIES */}
      <section className="sec" id="subsidies" style={{ paddingTop: 30 }}>
        <div className="wrap emp-subsidy">
          <div className="emp-subsidy-copy">
            <p className="eyebrow o">Funding that lowers the cost</p>
            <h2>A vetted builder, often with part of the wage covered.</h2>
            <p className="muted">
              Paid student placements in Canada can qualify for public support. We tell you which programmes may apply
              and help with the paperwork, so a placement costs you less.
            </p>
          </div>
          <div className="emp-subsidy-cards">
            <div className="emp-fund">
              <span className="chip blue">Federal</span>
              <h3>Student Work Placement Program</h3>
              <p className="emp-amount">Up to $5,000 <small>per placement</small></p>
              <p className="muted">For paid work placements for post-secondary students. Employers apply through one of the programme’s funded delivery organisations, and intakes can close when funding runs out.</p>
              <a className="linkish" href="https://www.canada.ca/en/employment-social-development/services/student-work-placements-wage-subsidies.html" target="_blank" rel="noopener noreferrer">Programme details ↗</a>
            </div>
            <div className="emp-fund">
              <span className="chip orange">Ontario</span>
              <h3>Co-operative Education Tax Credit</h3>
              <p className="emp-amount">25 to 30% <small>of eligible wages, up to $3,000 per placement</small></p>
              <p className="muted">For Ontario employers hiring students from a recognised co-op programme at an eligible Ontario institution, for at least 10 consecutive weeks.</p>
              <a className="linkish" href="https://www.ontario.ca/page/co-operative-education-tax-credit" target="_blank" rel="noopener noreferrer">Programme details ↗</a>
            </div>
            <p className="dim emp-note">
              Amounts and eligibility are set by each programme and can change. Placements must be paid roles that meet the programme’s rules.
              This is general information, not tax or legal advice.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec" id="how" style={{ paddingTop: 30 }}>
        <div className="wrap journey">
          <div className="journey-sticky">
            <p className="eyebrow">How a sprint brief works</p>
            <h2 style={{ fontSize: "clamp(34px,4.4vw,56px)", margin: "12px 0 16px" }}>From problem<br />to prototype.</h2>
            <p className="muted" style={{ maxWidth: 420 }}>Four steps, a named reviewer throughout and no surprises about who owns the work.</p>
            <ul className="emp-promises">
              <li>Builders are always paid.</li>
              <li>You own what is delivered.</li>
              <li>Confidentiality agreed up front.</li>
              <li>A named reviewer on every brief.</li>
            </ul>
          </div>
          <div className="steps">
            {STEPS.map(([h, p], i) => (
              <div className="step" key={h}><b>0{i + 1}</b><div><h3>{h}</h3><p className="muted">{p}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* ENQUIRY */}
      <section className="sec" id="enquire" style={{ paddingTop: 30 }}>
        <div className="wrap grid-side">
          <div className="stack" style={{ alignContent: "start" }}>
            <p className="eyebrow o">Start a conversation</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)" }}>Bring one problem. We’ll take it from there.</h2>
            <p className="muted" style={{ fontSize: 17 }}>
              Tell us a little about your organisation and how you’d like to work with builders. We reply within two working days to book a discovery call.
            </p>
            <div className="grid-2" style={{ marginTop: 10 }}>
              <Link className="item" href="/briefs"><span className="chip blue">See examples</span><h3>Browse open briefs</h3></Link>
              <Link className="item" href="/open-house"><span className="chip orange">Meet builders</span><h3>Open House</h3></Link>
            </div>
          </div>
          <div className="card" style={{ padding: 30 }}>
            <h2>Tell us what you need</h2>
            <p className="muted" style={{ marginBottom: 18 }}>Takes about a minute.</p>
            <SmartForm
              action={sendEmployerEnquiry}
              submit="Request a discovery call"
              resetOnSuccess
              fields={[
                { name: "name", label: "Your name", required: true, autoComplete: "name", defaultValue: user?.name ?? "", half: true },
                { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email", defaultValue: user?.email ?? "", half: true },
                { name: "organisation", label: "Organisation", required: true, autoComplete: "organization", maxLength: 140, defaultValue: user?.organisation ?? "", half: true },
                { name: "website", label: "Website", type: "url", placeholder: "https://", maxLength: 300, half: true },
                { name: "size", type: "select", label: "Organisation size", required: true, options: opts(EMPLOYER_SIZES, "Choose one") },
                { name: "option", type: "select", label: "How you’d like to start", required: true, options: opts(EMPLOYER_OPTIONS, "Choose one") },
                { name: "message", type: "textarea", label: "The problem or role you have in mind", maxLength: 2000, placeholder: "For example: our claims team spends hours checking documents by hand." },
                { name: "company_website", type: "hidden", defaultValue: "" },
              ]}
            />
          </div>
        </div>
      </section>
    </>
  );
}

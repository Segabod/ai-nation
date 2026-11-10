import Photo from "@/src/components/Photo";
import SmartForm from "@/src/components/SmartForm";
import { registerOpenHouse } from "@/app/actions/app";
import { ATTEND_AS, opts } from "@/src/lib/constants";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = { title: "Open House" };

export default async function OpenHouse() {
  const user = await getCurrentUser();
  const defaultAs = user?.role === "BUILDER" ? ATTEND_AS[0] : user?.role === "ORGANISATION" ? ATTEND_AS[1] : user?.role === "PARTNER" ? ATTEND_AS[3] : "";
  return (
    <>
      <section className="wrap" style={{ paddingTop: 20 }}>
        <div className="openhouse" style={{ minHeight: 480 }}>
          <Photo src="/event.jpg" alt="A builder in an AI shirt talking with a student at a busy campus showcase" />
          <div className="oh-top"><span>AI NATION PRESENTS</span><span>CONCEPT EDITION</span></div>
          <div className="oh-in">
            <div><p className="eyebrow o">An open floor for possibility</p><h2>Open<br /><span>house.</span></h2></div>
            <div>
              <p style={{ fontFamily: "var(--display)", fontSize: 22 }}>Come for the work. Stay for the people.</p>
              <p className="muted" style={{ marginTop: 10 }}>Builders demonstrate working projects and meet employers, founders and potential clients. Explore a solution, bring a business challenge, or find someone you’d like to build with.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page wrap grid-side" id="register">
        <div className="stack">
          {[
            ["Live demonstrations.", "Working projects, not slides. Builders walk through what they made and why."],
            ["The people behind the work.", "Meet the individuals and teams, hear their reasoning and ask about their contribution."],
            ["The conversation that comes next.", "Bring a business challenge. Leave with a shortlist of people you’d like to build with."],
          ].map(([h, p], i) => (
            <div className="step" key={h}><b>0{i + 1}</b><div><h3>{h}</h3><p className="muted">{p}</p></div></div>
          ))}
          <p className="notice info">Programme in development. No event date confirmed. Register interest and we’ll share the date, venue and format first.</p>
        </div>
        <div className="card">
          <h2>Plan my participation</h2>
          <p className="muted" style={{ marginBottom: 18 }}>Tell us how you’d like to take part.</p>
          <SmartForm
            action={registerOpenHouse}
            submit="Register my interest"
            resetOnSuccess
            fields={[
              { name: "name", label: "Full name", required: true, defaultValue: user?.name ?? "" },
              { name: "email", label: "Email", type: "email", required: true, defaultValue: user?.email ?? "" },
              { name: "attendAs", type: "select", label: "I’d like to attend as", required: true, defaultValue: defaultAs, options: opts(ATTEND_AS, "Choose one") },
              { name: "organisation", label: "Organisation, school or community", defaultValue: user?.organisation ?? "" },
              { name: "note", type: "textarea", label: "Anything we should know?", maxLength: 1000, placeholder: "The project you’d demo, or the challenge you’d bring." },
              { name: "company_website", type: "hidden", defaultValue: "" },
            ]}
          />
        </div>
      </section>
    </>
  );
}

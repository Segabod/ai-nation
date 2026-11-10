import Link from "next/link";
import SmartForm from "@/src/components/SmartForm";
import { sendInquiry } from "@/app/actions/app";
import { TOPICS, opts } from "@/src/lib/constants";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = { title: "Let’s talk" };

export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const user = await getCurrentUser();
  const { topic } = await searchParams;
  const defTopic = TOPICS.find((t) => t === topic) ??
    (user?.role === "BUILDER" ? TOPICS[0] : user?.role === "ORGANISATION" ? TOPICS[1] : user?.role === "PARTNER" ? TOPICS[2] : "");
  return (
    <div className="page wrap grid-side">
      <div className="stack" style={{ alignContent: "start" }}>
        <p className="eyebrow o">Let’s talk</p>
        <h1 style={{ fontSize: "clamp(38px,5vw,64px)" }}>Your next chapter starts with a conversation.</h1>
        <p className="muted" style={{ fontSize: 18 }}>Bring your talent. Bring your challenge. Let’s find the right starting point.</p>
        <div className="grid-3" style={{ marginTop: 16 }}>
          <Link className="item" href="/signup?role=builder"><span className="chip orange">Builders</span><h3>Start a passport</h3></Link>
          <Link className="item" href="/briefs/new"><span className="chip blue">Organisations</span><h3>Publish a brief</h3></Link>
          <Link className="item" href="/signup?role=partner"><span className="chip">Partners</span><h3>Register a community</h3></Link>
        </div>
      </div>
      <div className="card">
        <h2>Send us a message</h2>
        <p className="muted" style={{ marginBottom: 18 }}>We reply within two working days.</p>
        <SmartForm
          action={sendInquiry}
          submit="Send message"
          resetOnSuccess
          fields={[
            { name: "name", label: "Full name", required: true, defaultValue: user?.name ?? "", half: true },
            { name: "email", label: "Email", type: "email", required: true, defaultValue: user?.email ?? "", half: true },
            { name: "topic", type: "select", label: "Topic", required: true, defaultValue: defTopic, options: opts(TOPICS, "Choose a topic") },
            { name: "message", type: "textarea", label: "Message", required: true, maxLength: 3000 },
            { name: "company_website", type: "hidden", defaultValue: "" },
          ]}
        />
      </div>
    </div>
  );
}

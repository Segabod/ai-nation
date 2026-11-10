import Link from "next/link";
import { requireUser } from "@/src/lib/auth";
import SmartForm from "@/src/components/SmartForm";
import { createBrief } from "@/app/actions/app";
import { ENGAGEMENTS, SECTORS, SHOWCASE, opts } from "@/src/lib/constants";

export const metadata = { title: "Publish a brief" };

export default async function NewBrief({ searchParams }: { searchParams: Promise<{ sector?: string }> }) {
  const user = await requireUser();
  const { sector } = await searchParams;
  const tpl = SHOWCASE.find((s) => s.key === sector);

  if (user.role !== "ORGANISATION" && user.role !== "ADMIN") {
    return (
      <div className="page wrap" style={{ maxWidth: 640 }}>
        <div className="card stack">
          <p className="eyebrow o">Briefs are published by organisations</p>
          <h1 style={{ fontSize: 34 }}>Have a project in mind?</h1>
          <p className="muted">Your account is set up as a {user.role === "BUILDER" ? "builder" : "community partner"}. Tell us about the opportunity and we’ll connect you with the right organisation.</p>
          <div className="row"><Link href="/contact" className="btn btn-primary">Talk to us <span className="ar">↗</span></Link><Link href="/briefs" className="btn btn-ghost">Browse briefs</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page wrap" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow o">{tpl ? tpl.tag : "New brief"}</p>
          <h1>Shape a project.</h1>
          <p>Describe the business need. We review every brief before it goes live, so scope and data access are clear for builders.</p>
        </div>
      </div>
      <div className="card">
        <SmartForm
          action={createBrief}
          submit="Submit brief for review"
          fields={[
            { name: "title", label: "Brief title", required: true, maxLength: 140, defaultValue: tpl?.h ?? "", placeholder: "e.g. Source-backed answers for our policy team" },
            { name: "sector", type: "select", label: "Sector", required: true, half: true, defaultValue: tpl?.key ?? "", options: opts(SECTORS, "Choose a sector") },
            { name: "engagement", type: "select", label: "Engagement model", required: true, half: true, defaultValue: "", options: opts(ENGAGEMENTS, "Choose a model") },
            { name: "summary", type: "textarea", label: "The business need", required: true, maxLength: 3000, defaultValue: tpl?.b ?? "", help: "What’s the problem, who has it, and what data or systems are involved?" },
            { name: "outcomes", type: "textarea", label: "What success looks like", required: true, maxLength: 2000, defaultValue: tpl ? tpl.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "", help: "Measurable outcomes, review steps and any human oversight requirements." },
            { name: "budget", label: "Budget or funding", maxLength: 120, placeholder: "e.g. CAD 8,000 to 12,000, or grant funded" },
          ]}
        />
      </div>
    </div>
  );
}

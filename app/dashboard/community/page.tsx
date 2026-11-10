import { eq } from "drizzle-orm";
import { db, communities } from "@/src/db";
import { requireUser } from "@/src/lib/auth";
import SmartForm from "@/src/components/SmartForm";
import { saveCommunity } from "@/app/actions/app";
import { COMMUNITY_KINDS, opts } from "@/src/lib/constants";

export const metadata = { title: "My community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser(["PARTNER"]);
  const { welcome } = await searchParams;
  const c = await db.query.communities.findFirst({ where: eq(communities.userId, user.id) });
  return (
    <div className="stack">
      {welcome && <p className="notice ok">Welcome, {user.name.split(" ")[0]}. Tell us about your community to get started.</p>}
      <div className="page-head" style={{ marginBottom: 6 }}>
        <div><p className="eyebrow o">Campus, community or hub</p><h1>{c ? c.name : "Register your community"}</h1>
          <p>Builders who list this name as their school or community on their passport will appear on your dashboard.</p></div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <SmartForm
          action={saveCommunity}
          submit={c ? "Save changes" : "Register community"}
          fields={[
            { name: "name", label: "Community name", required: true, defaultValue: c?.name ?? user.organisation ?? "" },
            { name: "kind", type: "select", label: "Type", required: true, half: true, defaultValue: c?.kind ?? "", options: opts(COMMUNITY_KINDS, "Choose a type") },
            { name: "size", label: "Approximate size", half: true, defaultValue: c?.size ?? "", placeholder: "e.g. 400 students" },
            { name: "description", type: "textarea", label: "About your community", required: true, defaultValue: c?.description ?? "", help: "Who your builders are, what they work on, and the kinds of projects you’d like to connect them with." },
            { name: "website", type: "url", label: "Website", defaultValue: c?.website ?? "", placeholder: "https://" },
          ]}
        />
      </div>
    </div>
  );
}

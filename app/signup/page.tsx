import Photo from "@/src/components/Photo";
import Link from "next/link";
import { redirect } from "next/navigation";
import SmartForm from "@/src/components/SmartForm";
import { signup } from "@/app/actions/auth";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = { title: "Create your account" };

const ROLE_COPY: Record<string, { tag: string; h: string; p: string }> = {
  BUILDER: { tag: "For builders", h: "Your best work deserves a next step.", p: "Bring your capstone, hackathon build or independent project. Build a Skills Passport and find paid opportunities." },
  ORGANISATION: { tag: "For organisations", h: "Find people who have already shown they can build.", p: "Publish a project brief, review assessed talent and shape embedded teams around a real business need." },
  PARTNER: { tag: "For campuses and communities", h: "Connect your talent with meaningful work.", p: "Register your campus, hackathon community or innovation hub and open a path from projects to paid work." },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role: r } = await searchParams;
  const role = (r || "builder").toUpperCase();
  const copy = ROLE_COPY[role] ?? ROLE_COPY.BUILDER;

  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden>
        <Photo src="/neon.jpg" alt="" />
        <p className="eyebrow o">{copy.tag}</p>
        <h2 style={{ marginTop: 12 }}>{copy.h}</h2>
        <p className="muted" style={{ marginTop: 12, maxWidth: 420 }}>{copy.p}</p>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">Join AI Nation</p>
        <h1>Create your account</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Already a member? <Link href="/login" className="linkish">Sign in</Link>
        </p>
        <SmartForm
          action={signup}
          submit="Create account"
          fields={[
            {
              name: "role", type: "roles", label: "I’m joining as", defaultValue: ROLE_COPY[role] ? role : "BUILDER",
              options: [
                { value: "BUILDER", label: "A builder", hint: "Students, graduates, independent talent" },
                { value: "ORGANISATION", label: "An organisation", hint: "Startups, businesses, nonprofits" },
                { value: "PARTNER", label: "A connector", hint: "Campuses, communities, hubs" },
              ],
            },
            { name: "name", label: "Full name", required: true, autoComplete: "name", half: true },
            { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", half: true },
            { name: "organisation", label: "Organisation, school or community", help: "Required for organisations and connectors." },
            { name: "password", label: "Password", type: "password", required: true, autoComplete: "new-password", help: "At least 10 characters, with a letter and a number." },
            { name: "terms", type: "checkbox", label: "I agree to the AI Nation terms and privacy notice.", required: true },
          ]}
        />
      </section>
    </div>
  );
}

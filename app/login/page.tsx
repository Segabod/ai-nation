import Photo from "@/src/components/Photo";
import Link from "next/link";
import { redirect } from "next/navigation";
import SmartForm from "@/src/components/SmartForm";
import { login } from "@/app/actions/auth";
import { getCurrentUser } from "@/src/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden>
        <Photo src="/lights.jpg" alt="" />
        <p className="eyebrow o">Welcome back</p>
        <h2 style={{ marginTop: 12 }}>Good work opens doors.</h2>
        <p className="muted" style={{ marginTop: 12, maxWidth: 420 }}>
          Pick up where you left off: your passport, your briefs, your next conversation.
        </p>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">AI Nation</p>
        <h1>Sign in</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          New here? <Link href="/signup" className="linkish">Create an account</Link>
        </p>
        <SmartForm
          action={login}
          submit="Sign in"
          variant="blue"
          fields={[
            { name: "next", type: "hidden", defaultValue: next ?? "/dashboard" },
            { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
            { name: "password", label: "Password", type: "password", required: true, autoComplete: "current-password" },
          ]}
        />
      </section>
    </div>
  );
}

import Photo from "@/src/components/Photo";
import Link from "next/link";
import SmartForm from "@/src/components/SmartForm";
import { forgotPassword } from "@/app/actions/auth";

export const metadata = { title: "Forgot your password" };

export default function ForgotPassword() {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden>
        <Photo src="/lights.jpg" alt="" />
        <p className="eyebrow o">Account help</p>
        <h2 style={{ marginTop: 12 }}>Back in, in a minute.</h2>
        <p className="muted" style={{ marginTop: 12, maxWidth: 420 }}>We’ll email you a single-use link to choose a new password.</p>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">AI Nation</p>
        <h1>Forgot your password?</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Enter the email you signed up with. Remembered it? <Link href="/login" className="linkish">Sign in</Link>
        </p>
        <SmartForm
          action={forgotPassword}
          submit="Email me a reset link"
          variant="blue"
          fields={[{ name: "email", label: "Email", type: "email", required: true, autoComplete: "email" }]}
        />
      </section>
    </div>
  );
}

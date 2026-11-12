import Photo from "@/src/components/Photo";
import Link from "next/link";
import SmartForm from "@/src/components/SmartForm";
import { resetPassword } from "@/app/actions/auth";
import { peekToken } from "@/src/lib/tokens";

export const metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = await peekToken(token, "RESET_PASSWORD");
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden>
        <Photo src="/lights.jpg" alt="" />
        <p className="eyebrow o">Account help</p>
        <h2 style={{ marginTop: 12 }}>A fresh start for your account.</h2>
        <p className="muted" style={{ marginTop: 12, maxWidth: 420 }}>Changing your password signs you out on every other device.</p>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">AI Nation</p>
        <h1>Choose a new password</h1>
        {valid ? (
          <SmartForm
            action={resetPassword}
            submit="Save new password"
            variant="blue"
            fields={[
              { name: "token", type: "hidden", defaultValue: token },
              { name: "password", label: "New password", type: "password", required: true, autoComplete: "new-password", help: "At least 10 characters, with a letter and a number." },
              { name: "confirm", label: "Confirm new password", type: "password", required: true, autoComplete: "new-password" },
            ]}
          />
        ) : (
          <div className="stack">
            <p className="notice err" role="alert">This reset link has expired or was already used. Links work for one hour.</p>
            <Link href="/forgot-password" className="btn btn-blue" style={{ justifySelf: "start" }}>Send a new link <span className="ar">↗</span></Link>
          </div>
        )}
      </section>
    </div>
  );
}

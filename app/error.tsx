"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page wrap" style={{ textAlign: "center", paddingTop: 100 }}>
      <p className="eyebrow o">Something went wrong</p>
      <h1 style={{ fontSize: "clamp(32px,4vw,52px)", margin: "12px 0" }}>We couldn’t load this page.</h1>
      <p className="muted">Please try again. If it keeps happening, let us know.</p>
      <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/contact" className="btn btn-ghost">Contact us</Link>
      </div>
    </div>
  );
}

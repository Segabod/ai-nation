import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page wrap" style={{ textAlign: "center", paddingTop: 100 }}>
      <p className="eyebrow o">404</p>
      <h1 style={{ fontSize: "clamp(36px,5vw,64px)", margin: "12px 0" }}>This page isn’t here.</h1>
      <p className="muted">It may have moved, or you may not have access to it.</p>
      <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
        <Link href="/" className="btn btn-primary">Back home <span className="ar">↗</span></Link>
        <Link href="/briefs" className="btn btn-ghost">Browse briefs</Link>
      </div>
    </div>
  );
}

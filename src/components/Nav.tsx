"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { AUDIENCES, LANDING, audienceForPath, type Audience } from "@/src/lib/audience";

type Props = { user: { name: string; role: string } | null; audience: Audience | null; theme: "dark" | "light" };

type L = { href: string; label: string };

function linksFor(aud: Audience | null, role: string | null): L[] {
  const talent = role === "ORGANISATION" || role === "ADMIN" ? [{ href: "/talent", label: "Talent" }] : [];
  switch (aud) {
    case "builder":
      return [
        { href: "/builders", label: "For builders" },
        { href: "/briefs", label: "Open briefs" },
        { href: "/builders#journey", label: "How it works" },
        { href: "/builders#passport", label: "Skills Passport" },
        { href: "/open-house", label: "Open House" },
      ];
    case "employer":
      return [
        { href: "/employers", label: "For employers" },
        { href: "/employers#options", label: "Ways to start" },
        { href: "/employers#subsidies", label: "Funding" },
        ...talent,
        { href: "/briefs", label: "Briefs" },
        { href: "/open-house", label: "Open House" },
      ];
    case "partner":
      return [
        { href: "/partners", label: "For partners" },
        { href: "/partners#ways", label: "Ways to partner" },
        { href: "/partners#tools", label: "Partner tools" },
        { href: "/open-house", label: "Open House" },
        { href: "/briefs", label: "Briefs" },
      ];
    default:
      return [
        { href: "/builders", label: "Builders" },
        { href: "/employers", label: "Employers" },
        { href: "/partners", label: "Partners" },
        { href: "/briefs", label: "Briefs" },
        { href: "/open-house", label: "Open House" },
        ...talent,
      ];
  }
}

export default function Nav({ user, audience, theme }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // The page you are on wins; otherwise your role, then what you chose last time.
  const aud = audienceForPath(path) ?? audience;
  const links = linksFor(aud, user?.role ?? null);

  return (
    <header className="nav">
      <div className="wrap nav-inner" style={{ position: "relative" }}>
        <Link href={LANDING} className="brand" aria-label="AI Nation home">
          <Logo /> ai nation
        </Link>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
          Menu
        </button>
        <nav id="nav-links" className={`nav-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {aud && (
            <Link href="/?choose=1" className="aud-switch" title="Change who you’re browsing as">
              Viewing as {AUDIENCES[aud].label.toLowerCase()} <span aria-hidden>⇄</span>
            </Link>
          )}
        </nav>
        <div className="nav-cta">
          <ThemeToggle initial={theme} />
          {user ? (
            <Link href="/dashboard" className="btn btn-light btn-sm">
              Dashboard <span className="ar">↗</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hide-sm">Sign in</Link>
              <Link
                href={aud === "employer" ? "/employers#enquire" : aud === "partner" ? "/partners#partner-form" : aud === "builder" ? "/signup?role=builder" : "/contact"}
                className="btn btn-light btn-sm"
              >
                <span className="hide-sm">{aud === "builder" ? "Join as a builder" : aud === "employer" ? "Book a call" : aud === "partner" ? "Partner with us" : "Let’s talk"}</span>
                <span className="show-sm">{aud === "builder" ? "Join" : aud === "employer" ? "Book" : aud === "partner" ? "Partner" : "Talk"}</span> <span className="ar">↗</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

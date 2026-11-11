"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

type Props = { user: { name: string; role: string } | null };

export default function Nav({ user }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const links = [
    { href: "/#paths", label: "Start here" },
    { href: "/briefs", label: "Briefs" },
    { href: "/#approach", label: "Journey" },
    { href: "/open-house", label: "Open House" },
    { href: "/#partner", label: "Partner" },
    ...(user && (user.role === "ORGANISATION" || user.role === "ADMIN") ? [{ href: "/talent", label: "Talent" }] : []),
  ];
  return (
    <header className="nav">
      <div className="wrap nav-inner" style={{ position: "relative" }}>
        <Link href="/" className="brand" aria-label="AI Nation home">
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
        </nav>
        <div className="nav-cta">
          {user ? (
            <Link href="/dashboard" className="btn btn-light btn-sm">
              Dashboard <span className="ar">↗</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hide-sm">Sign in</Link>
              <Link href="/contact" className="btn btn-light btn-sm">
                Let’s talk <span className="ar">↗</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

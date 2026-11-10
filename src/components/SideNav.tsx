"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav({ links, name, roleLabel, logout }: {
  links: { href: string; label: string }[];
  name: string;
  roleLabel: string;
  logout: () => Promise<void>;
}) {
  const path = usePathname();
  return (
    <aside className="side" aria-label="Dashboard">
      <div className="who"><b>{name}</b><span className="dim" style={{ fontSize: 13 }}>{roleLabel}</span></div>
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>{l.label}</Link>
      ))}
      <form action={logout}>
        <button className="linkish" style={{ padding: "10px 14px", color: "var(--muted)" }}>Sign out</button>
      </form>
    </aside>
  );
}

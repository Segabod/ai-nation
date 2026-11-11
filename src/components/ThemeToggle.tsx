"use client";
import { useEffect, useState } from "react";

export const THEME_COOKIE = "ain_theme";
type Theme = "dark" | "light";

/** Switches between the dark (default) and white themes and remembers the choice for a year. */
export default function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"), []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  const toLight = theme !== "light";
  return (
    <button type="button" className="theme-toggle" onClick={toggle}
      aria-label={toLight ? "Switch to the white theme" : "Switch to the dark theme"} title={toLight ? "White theme" : "Dark theme"}>
      {toLight ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
      )}
    </button>
  );
}

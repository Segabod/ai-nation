/**
 * The three audiences AI Nation serves. Each has its own public home page;
 * the homepage asks which one you are and remembers it in a cookie, and
 * signed-in members are routed by their role.
 */
export const AUDIENCE_COOKIE = "ain_aud";

/** Where the AI Nation logo goes from any page: the landing page, without redirects. */
export const LANDING = "/?home=1";

export const AUDIENCES = {
  builder: { path: "/builders", label: "Builder", who: "Students, graduates & independent talent" },
  employer: { path: "/employers", label: "Employer", who: "Startups, businesses & nonprofits" },
  partner: { path: "/partners", label: "Partner", who: "Campuses, communities & innovation hubs" },
} as const;

export type Audience = keyof typeof AUDIENCES;

export function isAudience(v: unknown): v is Audience {
  return typeof v === "string" && v in AUDIENCES;
}

/** Which audience a public path belongs to, if any. */
export function audienceForPath(path: string): Audience | null {
  for (const [k, a] of Object.entries(AUDIENCES)) {
    if (path === a.path || path.startsWith(a.path + "/")) return k as Audience;
  }
  return null;
}

/** Signed-in members see the audience that matches their role. Admins see everything. */
export function audienceForRole(role: string | null | undefined): Audience | null {
  if (role === "BUILDER") return "builder";
  if (role === "ORGANISATION") return "employer";
  if (role === "PARTNER") return "partner";
  return null;
}

/** Where a signed-in member's "home" is. */
export function homeForRole(role: string): string {
  if (role === "BUILDER") return "/dashboard/passport";
  if (role === "PARTNER") return "/dashboard/community";
  return "/dashboard";
}

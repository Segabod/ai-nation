import "server-only";

/**
 * Transactional email through Resend's HTTP API (no SDK needed).
 *
 * Env:
 *   RESEND_API_KEY  required to actually send; without it emails are logged to the server console
 *   EMAIL_FROM      e.g. "AI Nation <hello@aination.ca>" (the domain must be verified in Resend)
 *   EMAIL_REPLY_TO  optional reply-to address
 *   APP_URL         public site address used in links, e.g. https://aination.ca
 *
 * Sending never throws: a failed email is logged, and the action the member took still succeeds.
 */

export type Mail = { to: string; subject: string; html: string; text: string };

const FROM = () => process.env.EMAIL_FROM || "AI Nation <onboarding@resend.dev>";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Base address for links in emails. Never derived from request headers, so links can't be poisoned. */
export function appUrl() {
  const explicit = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const branch = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (branch) return `https://${branch}`;
  return "http://localhost:3000";
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] RESEND_API_KEY not set; would send to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM(),
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend refused (${res.status}) for ${mail.subject}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[email] Send failed for ${mail.subject}:`, e);
    return false;
  }
}

/* ---------------- templates ---------------- */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type Block = { heading: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string };

/** One branded layout for every email: navy header, white card, orange button. */
function render(to: string, subject: string, b: Block): Mail {
  const p = b.paragraphs.map((x) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1b2a41">${esc(x)}</p>`).join("");
  const button = b.cta
    ? `<p style="margin:22px 0"><a href="${esc(b.cta.url)}" style="display:inline-block;background:#f7a01e;color:#0a1628;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">${esc(b.cta.label)}</a></p>
       <p style="margin:0 0 14px;font-size:12.5px;color:#5b6b82">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(b.cta.url)}</span></p>`
    : "";
  const foot = b.footnote ? `<p style="margin:18px 0 0;font-size:12.5px;color:#5b6b82">${esc(b.footnote)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#eef3fa;font-family:Poppins,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3fa;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="background:#0a1628;border-radius:16px 16px 0 0;padding:20px 28px;color:#fff;font-weight:700;font-size:18px;letter-spacing:.02em">AI <span style="color:#f7a01e">Nation</span></td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px">
<h1 style="margin:0 0 16px;font-size:21px;color:#0a1628">${esc(b.heading)}</h1>${p}${button}${foot}
</td></tr>
<tr><td style="padding:16px 8px;font-size:12px;color:#7a889c;text-align:center">AI Nation · People. Skills. Opportunity.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [b.heading, "", ...b.paragraphs, ...(b.cta ? ["", `${b.cta.label}: ${b.cta.url}`] : []), ...(b.footnote ? ["", b.footnote] : [])].join("\n");
  return { to, subject, html, text };
}

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

export const templates = {
  verifyEmail: (to: string, name: string, url: string) =>
    render(to, "Confirm your email for AI Nation", {
      heading: `Welcome, ${first(name)}`,
      paragraphs: ["Please confirm this is your email address so organisations and partners can reach you."],
      cta: { label: "Confirm my email", url },
      footnote: "This link works for 48 hours. If you didn’t create an AI Nation account, you can ignore this email.",
    }),

  resetPassword: (to: string, name: string, url: string) =>
    render(to, "Reset your AI Nation password", {
      heading: `Reset your password, ${first(name)}`,
      paragraphs: ["Someone asked to reset the password for this AI Nation account. If that was you, choose a new password below."],
      cta: { label: "Choose a new password", url },
      footnote: "This link works for one hour and can be used once. If you didn’t ask for this, ignore this email; your password stays the same.",
    }),

  passwordChanged: (to: string, name: string) =>
    render(to, "Your AI Nation password was changed", {
      heading: `Password changed, ${first(name)}`,
      paragraphs: [
        "The password for your AI Nation account was just changed, and every other device was signed out.",
        "If you didn’t do this, reply to this email straight away so we can secure your account.",
      ],
    }),

  interestStatus: (to: string, name: string, brief: string, status: "SHORTLISTED" | "ACCEPTED" | "DECLINED", url: string) => {
    const copy = {
      SHORTLISTED: {
        subject: `You’ve been shortlisted: ${brief}`,
        heading: "Good news: you’re on the shortlist",
        p: [`The team behind “${brief}” has shortlisted you. They can now see your email address and may contact you directly to talk next steps.`],
      },
      ACCEPTED: {
        subject: `You’ve been selected: ${brief}`,
        heading: "Congratulations, you’ve been selected",
        p: [`The team behind “${brief}” has accepted your interest. Expect them to be in touch about the engagement shortly.`],
      },
      DECLINED: {
        subject: `An update on ${brief}`,
        heading: "An update on your application",
        p: [
          `The team behind “${brief}” has decided not to move forward with your application this time.`,
          "Every brief you take part in builds your Skills Passport. Keep adding evidence and expressing interest in briefs that fit.",
        ],
      },
    }[status];
    return render(to, copy.subject, { heading: `${copy.heading}, ${first(name)}`, paragraphs: copy.p, cta: { label: "View my applications", url } });
  },

  newInterest: (to: string, name: string, brief: string, builder: string, url: string) =>
    render(to, `New interest in ${brief}`, {
      heading: `New interest, ${first(name)}`,
      paragraphs: [`${builder} has expressed interest in “${brief}”. Review their note and Skills Passport, then shortlist or decline.`],
      cta: { label: "Review applicants", url },
    }),

  briefDecision: (to: string, name: string, brief: string, approved: boolean, url: string) =>
    render(to, approved ? `Your brief is live: ${brief}` : `Your brief needs changes: ${brief}`, {
      heading: approved ? `Your brief is live, ${first(name)}` : `About your brief, ${first(name)}`,
      paragraphs: approved
        ? [`“${brief}” has been approved and is now visible to builders on the briefs board. We’ll email you as interest comes in.`]
        : [`“${brief}” wasn’t approved for the briefs board. Reply to this email and the AI Nation team will help you shape it.`],
      cta: { label: "Open the brief", url },
    }),
};

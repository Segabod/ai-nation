// Knowledge for the AI Nation help assistant, plus an offline FAQ fallback
// used when the AI model is unavailable.

export const SITE_GUIDE = `
AI Nation connects university, college and hackathon talent ("builders") with organisations ready to build something meaningful.
Tagline: People. Skills. Opportunity. Model: Discover, Develop, Connect. It is a concept edition: programmes are in development.

ACCOUNT TYPES (chosen at sign up, /signup):
- Builder (/signup?role=builder): students, graduates, independent talent. Builds a Skills Passport, browses briefs, expresses interest.
- Organisation (/signup?role=organisation): startups, businesses, nonprofits. Publishes project briefs, reviews applicants, searches the talent directory.
- Community partner (/signup?role=partner): campuses, hackathon communities, innovation hubs. Registers their community and sees builders linked to it.
- Admin: AI Nation team only. Cannot be chosen at sign up.
Passwords need at least 10 characters with a letter and a number. Sign in at /login. Sign out from the dashboard sidebar.
There is no self-service password reset yet: people who are locked out should use the contact form (/contact).
After 8 failed sign-in attempts an account is paused for 15 minutes.

PAGES:
- / home page. /briefs open project briefs, filterable by sector. /briefs/<id> a single brief.
- /briefs/new publish a brief (organisations). Can be prefilled from templates: /briefs/new?sector=Knowledge, Insurance, Commerce or Healthcare.
- /open-house Open House showcase: register interest (no date confirmed yet).
- /contact "Let's talk" form; replies within two working days.
- /dashboard personal dashboard. /dashboard/passport Skills Passport (builders) or profile (others).
- /dashboard/community community profile (partners). /talent talent directory (organisations only).

BUILDERS, step by step:
1. Sign up as a builder. 2. Open the Skills Passport (/dashboard/passport): add a headline, short bio, skills (comma separated), links, and your school or community.
3. Add projects: title, project context, YOUR individual contribution (the part that matters most), tools, and a demo or repo link.
4. Tick "open to work" to appear in the talent directory. 5. Browse /briefs, open one and use "Express interest" with a note of at least 30 characters.
6. Track applications on /dashboard (statuses: Submitted, Shortlisted, Accepted, Declined). You can withdraw while it is still Submitted.
Organisations only see a builder's email address once they shortlist or accept them.
Use "Preview what organisations see" on the passport page to check your public passport.

ORGANISATIONS, step by step:
1. Sign up as an organisation (organisation name required). 2. Publish a brief at /briefs/new: title, sector, engagement model (Managed project, Embedded team, Individual contract, Internship or placement, Not sure yet), the business need, what success looks like, optional budget.
3. Every new brief is reviewed by the AI Nation team before it goes public, usually within two working days. Status shows "In review" until then.
4. Manage a brief from /dashboard: shortlist, accept or decline applicants, email shortlisted builders, set the brief Open, In progress or Closed.
5. Search builders by skill, school or name at /talent.
The four example briefs on the home page (Knowledge, Insurance, Commerce, Healthcare) are illustrative concepts, not client case studies.

COMMUNITY PARTNERS: sign up as a connector, then register the community at /dashboard/community (name, type, size, description, website).
Builders appear on the partner's dashboard when the school or community on their passport matches the community name. Share /signup?role=builder with members.

OPEN HOUSE: a proposed showcase where builders demo working projects and meet employers, founders and potential clients. No event date is confirmed. Register at /open-house to be told first.

PRIVACY AND SAFETY: passwords are hashed; sessions are secure cookies. Briefs keep decisions with people ("human oversight, by design").
`;

type Faq = { k: string[]; a: string };
const FAQ: Faq[] = [
  { k: ["sign up", "signup", "register", "create account", "join", "account"], a: "You can create a free account at [Sign up](/signup). Pick **Builder** if you want to show your work and find projects, **Organisation** if you need a team, or **Community partner** if you run a campus or community." },
  { k: ["password", "forgot", "reset", "locked", "can't log", "cannot log", "sign in", "login", "log in"], a: "Sign in at [Sign in](/login). There's no self-service password reset yet, so if you're locked out please message the team through [Contact](/contact). After 8 failed attempts sign-in pauses for 15 minutes." },
  { k: ["passport", "profile", "skills", "project", "portfolio"], a: "Your Skills Passport lives at [Skills Passport](/dashboard/passport). Add a headline, skills and at least one project. Focus on **your individual contribution**: it matters more than the prize." },
  { k: ["apply", "interest", "brief", "opportunit", "work", "job", "paid"], a: "Browse open projects at [Briefs](/briefs). Open one and use **Express interest** with a short note about why you're a fit. Track your applications on your [Dashboard](/dashboard)." },
  { k: ["publish", "post", "hire", "talent", "team", "organisation", "organization", "company"], a: "Organisations can publish a project at [Publish a brief](/briefs/new). Our team reviews each brief before it goes live, usually within two working days. You can also search builders in the [Talent directory](/talent)." },
  { k: ["review", "pending", "approve", "in review"], a: "New briefs show **In review** until the AI Nation team approves them, usually within two working days. Need it sooner? Use [Contact](/contact)." },
  { k: ["partner", "community", "campus", "university", "college", "hub", "hackathon"], a: "Campuses and communities can sign up as a [Community partner](/signup?role=partner), then register at [My community](/dashboard/community). Builders who list your community on their passport show up on your dashboard." },
  { k: ["open house", "event", "showcase", "demo day", "date"], a: "Open House is a proposed showcase for live demos. No date is confirmed yet. [Register your interest](/open-house) and you'll hear first." },
  { k: ["contact", "talk", "human", "person", "email", "support", "help"], a: "You can reach the AI Nation team through [Contact](/contact). We reply within two working days." },
  { k: ["cost", "price", "free", "pay", "fee"], a: "Creating an account and building your passport is free. Budgets for individual projects are set by each organisation on its brief." },
];

export function faqAnswer(q: string): string {
  const s = q.toLowerCase();
  let best: Faq | null = null;
  let score = 0;
  for (const f of FAQ) {
    const n = f.k.filter((k) => s.includes(k)).length;
    if (n > score) { score = n; best = f; }
  }
  return best
    ? best.a
    : "I can help with signing up, the Skills Passport, briefs, Open House and community partnerships. For anything else, the team is happy to help through [Contact](/contact).";
}

export const SUGGESTIONS: Record<string, string[]> = {
  GUEST: ["How does AI Nation work?", "Which account type should I choose?", "When is Open House?"],
  BUILDER: ["How do I make my passport stand out?", "How do I apply to a brief?", "What do the application statuses mean?"],
  ORGANISATION: ["How do I publish a brief?", "Why is my brief in review?", "How do I contact a builder?"],
  PARTNER: ["How do builders link to my community?", "What can I see on my dashboard?", "How do I invite my members?"],
  ADMIN: ["How does brief approval work?", "What can admins change?", "How do I export Open House sign-ups?"],
};

# AI Nation

People. Skills. Opportunity. A full-stack platform connecting university, college and hackathon builders with organisations ready to build something meaningful.

Built with Next.js 15 (App Router, server actions), PostgreSQL and Drizzle ORM. No external auth provider is required.

## What's included

**Public site**
- Landing page (original AI Nation design and copy) with every call to action wired to a real destination
- Briefs board with sector filters, and individual brief pages
- Open House page with registration form
- Contact ("Let's talk") form

**Accounts and authorization**
- Sign up as a Builder, Organisation or Community partner; sign in; sign out
- Passwords hashed with bcrypt (cost 12); minimum 10 characters with a letter and a number
- Server-side sessions: random 256-bit token in an httpOnly, SameSite=Lax, Secure cookie; only a SHA-256 hash is stored, so sessions can be revoked (suspending a user signs them out everywhere)
- Login rate limiting (8 failures per email, 32 per IP, per 15 minutes) and constant-time responses for unknown emails
- Role-based access on every page and every server action, with ownership checks (an organisation can only manage its own briefs; a builder can only edit their own passport)
- Middleware bounces anonymous visitors from private areas; `?next=` return path is validated against open redirects
- Security headers (frame denial, nosniff, referrer policy), honeypot spam traps on public forms, CSV formula-injection protection

**Help assistant ("Nation Guide")**
- Chat bubble on every page that answers questions about using AI Nation, links people to the right page, knows which briefs are open and who is asking
- Runs through Vercel AI Gateway (authenticated automatically on Vercel; set `AI_GATEWAY_API_KEY` to run it locally). Tries Claude Haiku 5.5, then Claude Haiku 4.5, then Gemini 2.5 Flash Lite; override the order with `HELP_MODELS`
- Falls back to a built-in FAQ if the model is unavailable, so help never goes dark
- Rate limited (25 questions per 10 minutes per person); every question is logged in Admin console → Help questions
- Edit what it knows in `src/lib/help.ts`

**Role workspaces**
| Role | Can do |
|---|---|
| Builder | Build a Skills Passport (profile, skills, links, project evidence with individual contribution), browse briefs, express interest, track and withdraw applications |
| Organisation | Publish briefs (prefilled from the four landing-page templates), see applicants, shortlist/accept/decline (applicant email revealed only once shortlisted), open/close briefs, search the talent directory |
| Community partner | Register their campus or community, see builders who list it on their passport and how many applications they've made |
| Admin | Approve or reject briefs before they go public, change roles, suspend/restore members, work the contact inbox, export Open House registrations as CSV |

## Run locally

```bash
npm install
cp .env.example .env          # fill in your Postgres URLs and admin credentials
npm run db:push               # create tables (or apply drizzle/0000_init.sql)
npm run db:seed               # create the admin account
node scripts/seed.mjs --demo  # optional: demo organisation, builders, partner and briefs
npm run dev
```

Demo accounts (password `DemoPass2026`): `org@demo.aination`, `builder@demo.aination`, `partner@demo.aination`.

## Deploy to Vercel

1. The brand photos (`lights.jpg`, `neon.jpg`, `chips.jpg`, `event.jpg`) sit at the repo root and are copied into `public/` at build time by `scripts/copy-assets.mjs`.
2. In the Vercel project, add a Postgres database (Storage → Neon), which sets `DATABASE_URL`. Add `DIRECT_URL` (the unpooled URL), `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Nothing to run by hand: every build applies pending migrations from `drizzle/` and creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if that account does not exist yet (`scripts/migrate.mjs`).
4. Push to `main`. Vercel builds with `next build`.

## Project layout

```
app/                 routes (pages, server actions in app/actions, CSV export in app/api)
src/db/schema.ts     database schema
src/lib/auth.ts      sessions, password hashing, guards, rate limiting
src/components/      Nav, SmartForm, landing interactions
scripts/seed.mjs     admin and demo seeding
drizzle/             SQL migration
middleware.ts        edge redirect for private routes
```

## Next steps worth considering
- Transactional email (password reset, application status notifications) via Resend or Postmark
- Email verification on sign-up
- File uploads for project evidence (Vercel Blob)

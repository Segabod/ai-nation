// Creates (or promotes) the first administrator, and optionally demo data.
// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='...' node scripts/seed.mjs [--demo]
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
if (!url || !email || password.length < 10) {
  console.error("Set DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters).");
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: false });
const hash = (p) => bcrypt.hash(p, 12);

await sql`
  insert into users (id, email, password_hash, name, role, organisation)
  values (${randomUUID()}, ${email}, ${await hash(password)}, 'AI Nation Admin', 'ADMIN', 'AI Nation')
  on conflict (email) do update set role = 'ADMIN', password_hash = excluded.password_hash`;
console.log(`Admin ready: ${email}`);

if (process.argv.includes("--demo")) {
  const demoPw = await hash("DemoPass2026");
  const org = randomUUID(), b1 = randomUUID(), b2 = randomUUID(), partner = randomUUID();
  await sql`insert into users ${sql([
    { id: org, email: "org@demo.aination", password_hash: demoPw, name: "Adaeze Okafor", role: "ORGANISATION", organisation: "Northwind Mutual", headline: "Head of Claims Operations", bio: null, skills: [], links: [] },
    { id: b1, email: "builder@demo.aination", password_hash: demoPw, name: "Tobi Adeyemi", role: "BUILDER", organisation: "Toronto Metropolitan University", headline: "MEng student building retrieval and document AI", bio: "I build practical AI tools with a bias for evaluation and human review.", skills: ["Python", "RAG", "FastAPI", "React", "Evaluation"], links: ["https://github.com/example"] },
    { id: b2, email: "builder2@demo.aination", password_hash: demoPw, name: "Maya Chen", role: "BUILDER", organisation: "Toronto Metropolitan University", headline: "Full-stack developer and hackathon winner", bio: null, skills: ["TypeScript", "Next.js", "Postgres", "UX"], links: [] },
    { id: partner, email: "partner@demo.aination", password_hash: demoPw, name: "Jordan Blake", role: "PARTNER", organisation: "Toronto Metropolitan University", headline: null, bio: null, skills: [], links: [] },
  ])} on conflict (email) do nothing`;
  const [{ id: orgId }] = await sql`select id from users where email = 'org@demo.aination'`;
  const [{ id: b1Id }] = await sql`select id from users where email = 'builder@demo.aination'`;
  const [{ id: pId }] = await sql`select id from users where email = 'partner@demo.aination'`;
  await sql`insert into communities (id, user_id, name, kind, size, description) values (${randomUUID()}, ${pId}, 'Toronto Metropolitan University', 'University or college', '400 builders', 'Graduate engineering and innovation students working on applied AI capstones.') on conflict (user_id) do nothing`;
  await sql`insert into projects (id, user_id, title, context, contribution, stack, url) values
    (${randomUUID()}, ${b1Id}, 'Policy Q&A with sources', 'Hackathon build for a municipal team that needed answers from 300 policy PDFs, with citations.', 'Built the retrieval pipeline, added document dates after finding outdated matches, and wrote the evaluation set of 60 known questions.', ${["Python", "pgvector", "FastAPI"]}, 'https://github.com/example/policy-qa')`;
  const existing = await sql`select count(*)::int as n from briefs where owner_id = ${orgId}`;
  if (existing[0].n === 0) {
    await sql`insert into briefs (id, owner_id, title, sector, summary, outcomes, engagement, budget, status) values
      (${b1}, ${orgId}, 'Give claims teams time to think', 'Insurance', 'Our motor claims team receives 1,200 documents a week. We want to extract key details, flag missing information and prepare a structured summary for an authorised reviewer. Claim decisions stay with people.', '1. Extraction accuracy above 95 percent on a test set\n2. Exceptions routed to a reviewer\n3. Summary time per claim cut by half', 'Managed project', 'CAD 10,000 to 15,000', 'OPEN'),
      (${b2}, ${orgId}, 'Source-backed answers for our underwriting manual', 'Knowledge', 'Underwriters spend hours searching a 400-page manual. We want answers with clear source references and a review step when information is uncertain.', 'Answers cite the exact section; uncertain answers are flagged; pilot with 10 underwriters.', 'Embedded team', 'Grant funded', 'PENDING')`;
  }
  console.log("Demo data loaded. Demo password for all demo users: DemoPass2026");
}
await sql.end();

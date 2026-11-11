ALTER TABLE "briefs" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Sample organisation that owns the sample brief. Its password hash is not a valid
-- bcrypt hash, so nobody can sign in as it.
INSERT INTO "users" ("id", "email", "password_hash", "name", "role", "organisation", "headline", "open_to_work")
VALUES ('00000000-5a3b-4e00-a000-000000000001', 'sample-organisation@ai-nation.invalid', '!disabled', 'AI Nation Sample', 'ORGANISATION', 'Harbourline Insurance (sample)', 'Illustrative organisation used to show how briefs work', false)
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
INSERT INTO "briefs" ("id", "owner_id", "title", "sector", "summary", "outcomes", "engagement", "budget", "status", "is_sample")
SELECT '00000000-5a3b-4e00-a000-000000000101', u."id",
  'Claims intake assistant for a mid-sized insurer',
  'Insurance',
  'Our claims team receives about 400 motor and property claims a month by email, as PDFs, photos and scanned forms. Handlers spend 20 to 30 minutes per claim reading documents, re-keying policy numbers, dates and amounts into our claims system, and chasing missing documents. We want a working prototype that reads a new claim pack, extracts the key details, checks them against the policy record and flags what is missing, so a handler can review a structured summary instead of starting from raw documents. Claim decisions stay with our licensed handlers. You will work with anonymised sample claims and a test copy of policy data; no real customer data leaves our systems.',
  '1. A prototype that takes a claim pack (email plus attachments) and produces a structured summary: policy number, claimant, incident date, claim type, amounts and documents received.
2. Automatic checks against the policy record (cover active on the incident date, claim type covered) with clear flags for anything that does not match.
3. A list of missing documents for each claim, with a draft request to the claimant for the handler to approve.
4. Tested on at least 50 anonymised sample claims, with extraction accuracy reported per field.
5. A short handover: how it works, its limits, and what a production version would need.',
  'Managed project',
  'CAD 12,000 to 18,000 for 6 weeks (illustrative)',
  'OPEN',
  true
FROM "users" u
WHERE u."email" = 'sample-organisation@ai-nation.invalid'
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "help_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"role" text,
	"page" text,
	"question" text NOT NULL,
	"answer" text,
	"source" text DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "help_logs" ADD CONSTRAINT "help_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "help_logs_created_idx" ON "help_logs" USING btree ("created_at");
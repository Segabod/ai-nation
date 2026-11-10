import {
  pgTable, pgEnum, text, timestamp, boolean, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

const id = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const created = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const roleEnum = pgEnum("role", ["BUILDER", "ORGANISATION", "PARTNER", "ADMIN"]);
export const briefStatusEnum = pgEnum("brief_status", ["PENDING", "OPEN", "IN_PROGRESS", "CLOSED", "REJECTED"]);
export const interestStatusEnum = pgEnum("interest_status", ["SUBMITTED", "SHORTLISTED", "ACCEPTED", "DECLINED"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("BUILDER"),
  organisation: text("organisation"),
  headline: text("headline"),
  bio: text("bio"),
  location: text("location"),
  skills: text("skills").array().notNull().default([]),
  links: text("links").array().notNull().default([]),
  openToWork: boolean("open_to_work").notNull().default(true),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: created(),
});

export const sessions = pgTable("sessions", {
  id: id(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

/** Builder Skills Passport evidence */
export const projects = pgTable("projects", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  context: text("context").notNull(),
  contribution: text("contribution").notNull(),
  stack: text("stack").array().notNull().default([]),
  url: text("url"),
  createdAt: created(),
});

export const briefs = pgTable("briefs", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sector: text("sector").notNull(),
  summary: text("summary").notNull(),
  outcomes: text("outcomes").notNull(),
  engagement: text("engagement").notNull(),
  budget: text("budget"),
  status: briefStatusEnum("status").notNull().default("PENDING"),
  createdAt: created(),
}, (t) => [index("briefs_status_idx").on(t.status)]);

export const interests = pgTable("interests", {
  id: id(),
  briefId: text("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pitch: text("pitch").notNull(),
  status: interestStatusEnum("status").notNull().default("SUBMITTED"),
  createdAt: created(),
}, (t) => [uniqueIndex("interest_unique").on(t.briefId, t.userId)]);

export const communities = pgTable("communities", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  size: text("size"),
  description: text("description").notNull(),
  website: text("website"),
  createdAt: created(),
});

export const registrations = pgTable("registrations", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  attendAs: text("attend_as").notNull(),
  organisation: text("organisation"),
  note: text("note"),
  createdAt: created(),
});

export const inquiries = pgTable("inquiries", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: created(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: id(),
  key: text("key").notNull(),
  createdAt: created(),
}, (t) => [index("login_attempts_key_idx").on(t.key)]);

export const briefsRelations = relations(briefs, ({ one, many }) => ({
  owner: one(users, { fields: [briefs.ownerId], references: [users.id] }),
  interests: many(interests),
}));
export const interestsRelations = relations(interests, ({ one }) => ({
  brief: one(briefs, { fields: [interests.briefId], references: [briefs.id] }),
  user: one(users, { fields: [interests.userId], references: [users.id] }),
}));
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  briefs: many(briefs),
  interests: many(interests),
  community: one(communities, { fields: [users.id], references: [communities.userId] }),
}));
export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
}));
export const communitiesRelations = relations(communities, ({ one }) => ({
  user: one(users, { fields: [communities.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Role = User["role"];

/** Questions asked to the help assistant, so admins can see what people need. */
export const helpLogs = pgTable("help_logs", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  role: text("role"),
  page: text("page"),
  question: text("question").notNull(),
  answer: text("answer"),
  source: text("source").notNull().default("ai"),
  createdAt: created(),
}, (t) => [index("help_logs_created_idx").on(t.createdAt)]);

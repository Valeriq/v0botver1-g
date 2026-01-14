import { pgTable, text, varchar, timestamp, boolean, uuid, integer, jsonb, bigint, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === Workspaces ===
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramChatId: bigint("telegram_chat_id", { mode: "number" }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Users ===
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull().unique(),
  role: varchar("role", { length: 50 }).default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Contacts ===
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  website: varchar("website", { length: 500 }),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Prompt Profiles ===
export const promptProfiles = pgTable("prompt_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  systemInstructions: text("system_instructions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Campaigns ===
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  promptProfileId: uuid("prompt_profile_id").notNull().references(() => promptProfiles.id),
  status: varchar("status", { length: 50 }).default("draft"),
  stats: jsonb("stats").default({ sent: 0, replied: 0, failed: 0 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Gmail Accounts ===
export const gmailAccounts = pgTable("gmail_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  status: varchar("status", { length: 50 }).default("ok"),
  dailySentCount: integer("daily_sent_count").default(0),
  quotaResetAt: timestamp("quota_reset_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Leads ===
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("new"),
  classification: varchar("classification", { length: 50 }),
  takenByUserId: uuid("taken_by_user_id").references(() => users.id),
  takenAt: timestamp("taken_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === CSV Uploads ===
export const csvUploads = pgTable("csv_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalContent: text("original_content").notNull(),
  supabaseUrl: varchar("supabase_url", { length: 500 }),
  rowCount: integer("row_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Insert Schemas ===
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true, stats: true });
export const insertPromptProfileSchema = createInsertSchema(promptProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGmailAccountSchema = createInsertSchema(gmailAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCsvUploadSchema = createInsertSchema(csvUploads).omit({ id: true, createdAt: true });

// === Types ===
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type PromptProfile = typeof promptProfiles.$inferSelect;
export type InsertPromptProfile = z.infer<typeof insertPromptProfileSchema>;

export type GmailAccount = typeof gmailAccounts.$inferSelect;
export type InsertGmailAccount = z.infer<typeof insertGmailAccountSchema>;

export type Lead = typeof leads.$inferSelect;

export type CsvUpload = typeof csvUploads.$inferSelect;
export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;

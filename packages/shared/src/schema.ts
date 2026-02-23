import { z } from "zod";

export const insertContactSchema = z.object({
  workspaceId: z.string().optional(),
  email: z.string().email("Некорректный email"),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  website: z.string().url("Некорректный URL").nullable().optional().or(z.literal("")),
});

export type InsertContact = z.infer<typeof insertContactSchema>;

export const insertCampaignSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1, "Название обязательно"),
  promptProfileId: z.string().nullable().optional(),
  steps: z.array(z.object({
    template: z.string(),
    delayHours: z.number().min(0),
  })).optional(),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export const insertPromptProfileSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1, "Название обязательно"),
  systemPrompt: z.string().min(1, "Системный промпт обязателен"),
});

export type InsertPromptProfile = z.infer<typeof insertPromptProfileSchema>;

export const insertGmailAccountSchema = z.object({
  email: z.string().email("Некорректный email"),
});

export type InsertGmailAccount = z.infer<typeof insertGmailAccountSchema>;
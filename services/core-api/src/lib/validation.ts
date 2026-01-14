import { z } from "zod"

// Campaign validation schemas
export const createCampaignSchema = z.object({
  workspace_id: z.string().uuid("Invalid workspace_id format"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  prompt_profile_id: z.string().uuid("Invalid prompt_profile_id").optional(),
  steps: z
    .array(
      z.object({
        template: z.string().min(1, "Template is required"),
        delay_hours: z.number().int().min(0).max(720, "Delay cannot exceed 30 days"),
      }),
    )
    .min(1, "At least one step required")
    .max(10, "Maximum 10 steps allowed"),
})

export const updateCampaignStatusSchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.enum(["active", "paused", "completed"], {
    errorMap: () => ({ message: "Status must be active, paused, or completed" }),
  }),
})

// Contact validation schemas
export const uploadContactsSchema = z.object({
  workspace_id: z.string().uuid(),
  file_content: z.string().min(1, "File content is required"),
  filename: z.string().max(255).optional(),
  delimiter: z.enum([",", "\t", ";"]).default(","),
})

export const addContactSchema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().email("Invalid email format"),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")).optional(),
  custom_fields: z.record(z.any()).optional(),
})

// Prompt profile validation
export const createPromptProfileSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  system_prompt: z.string().min(10, "System prompt too short").max(5000, "System prompt too long"),
  user_prompt_template: z.string().min(10).max(5000),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().min(50).max(4000).default(500),
})

// Lead validation
export const updateLeadStatusSchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "closed_won", "closed_lost"]),
})

// Pagination schema
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Helper function to validate and parse
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

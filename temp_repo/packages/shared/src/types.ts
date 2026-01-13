// Shared types across all services

export interface Workspace {
  id: string
  telegram_user_id: string
  name: string | null
  created_at: Date
  updated_at: Date
}

export interface User {
  id: string
  workspace_id: string
  telegram_username: string | null
  telegram_first_name: string | null
  telegram_last_name: string | null
  role: "owner" | "member"
  created_at: Date
}

export interface Contact {
  id: string
  workspace_id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  website: string | null
  custom_fields: Record<string, any>
  created_at: Date
}

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  status: "draft" | "active" | "paused" | "completed"
  prompt_profile_id: string | null
  created_at: Date
  updated_at: Date
}

export interface QueueJob {
  id: string
  queue: string
  data: Record<string, any>
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  max_attempts: number
  error: string | null
  created_at: Date
  processed_at: Date | null
}

export interface HealthStatus {
  status: "ok" | "degraded" | "down"
  timestamp: Date
  service: string
  version: string
  dependencies?: Record<string, boolean>
}

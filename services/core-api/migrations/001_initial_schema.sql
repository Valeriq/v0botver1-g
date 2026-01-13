-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_telegram_chat_id ON workspaces(telegram_chat_id);
CREATE INDEX idx_workspaces_status ON workspaces(status);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_workspace_id ON users(workspace_id);
CREATE INDEX idx_users_telegram_user_id ON users(telegram_user_id);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  website VARCHAR(500),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company);

-- Suppression List
CREATE TABLE suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_suppression_workspace_id ON suppression_list(workspace_id);
CREATE INDEX idx_suppression_email ON suppression_list(email);

-- Prompt Profiles
CREATE TABLE prompt_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  system_instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_profiles_workspace_id ON prompt_profiles(workspace_id);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  prompt_profile_id UUID NOT NULL REFERENCES prompt_profiles(id),
  status VARCHAR(50) DEFAULT 'draft',
  stats JSONB DEFAULT '{"sent": 0, "replied": 0, "failed": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_prompt_profile_id ON campaigns(prompt_profile_id);

-- Campaign Steps
CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  template TEXT NOT NULL,
  delay_hours INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, step_number)
);

CREATE INDEX idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);

-- Campaign Recipients
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX idx_campaign_recipients_next_send_at ON campaign_recipients(next_send_at);

-- Gmail Accounts
CREATE TABLE gmail_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'ok',
  daily_sent_count INT DEFAULT 0,
  quota_reset_at TIMESTAMPTZ DEFAULT NOW(),
  watch_expiration TIMESTAMPTZ,
  watch_history_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gmail_accounts_status ON gmail_accounts(status);
CREATE INDEX idx_gmail_accounts_email ON gmail_accounts(email);

-- Account Assignments
CREATE TABLE account_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_account_id UUID NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gmail_account_id, workspace_id)
);

CREATE INDEX idx_account_assignments_gmail_id ON account_assignments(gmail_account_id);
CREATE INDEX idx_account_assignments_workspace_id ON account_assignments(workspace_id);

-- Email Messages
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  gmail_account_id UUID NOT NULL REFERENCES gmail_accounts(id),
  gmail_message_id VARCHAR(255),
  gmail_thread_id VARCHAR(255),
  step_number INT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_messages_campaign_id ON email_messages(campaign_id);
CREATE INDEX idx_email_messages_recipient_id ON email_messages(recipient_id);
CREATE INDEX idx_email_messages_gmail_thread_id ON email_messages(gmail_thread_id);
CREATE INDEX idx_email_messages_status ON email_messages(status);

-- Reply Events
CREATE TABLE reply_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  gmail_message_id VARCHAR(255) UNIQUE NOT NULL,
  reply_body TEXT NOT NULL,
  classification VARCHAR(50),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reply_events_email_message_id ON reply_events(email_message_id);
CREATE INDEX idx_reply_events_classification ON reply_events(classification);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  gmail_thread_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  classification VARCHAR(50),
  taken_by_user_id UUID REFERENCES users(id),
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_gmail_thread_id ON leads(gmail_thread_id);
CREATE INDEX idx_leads_taken_by ON leads(taken_by_user_id);

-- AI Artifacts
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_artifacts_workspace_id ON ai_artifacts(workspace_id);
CREATE INDEX idx_ai_artifacts_type ON ai_artifacts(artifact_type);

-- Billing Ledger
CREATE TABLE billing_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_ledger_workspace_id ON billing_ledger(workspace_id);
CREATE INDEX idx_billing_ledger_created_at ON billing_ledger(created_at DESC);

-- Queue Jobs
CREATE TABLE queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_queue_jobs_queue_name ON queue_jobs(queue_name);
CREATE INDEX idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX idx_queue_jobs_scheduled_at ON queue_jobs(scheduled_at);

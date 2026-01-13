-- Additional performance indexes for common queries

-- Composite index for finding contacts to add to campaigns
CREATE INDEX idx_contacts_workspace_email ON contacts(workspace_id, email);

-- Composite index for campaign recipient scheduling
CREATE INDEX idx_recipients_campaign_status_next_send 
  ON campaign_recipients(campaign_id, status, next_send_at) 
  WHERE status = 'pending' AND next_send_at IS NOT NULL;

-- Index for finding messages by thread for reply detection
CREATE INDEX idx_email_messages_thread_campaign 
  ON email_messages(gmail_thread_id, campaign_id);

-- Partial index for active campaigns
CREATE INDEX idx_campaigns_active 
  ON campaigns(workspace_id) 
  WHERE status = 'active';

-- Partial index for new leads
CREATE INDEX idx_leads_new 
  ON leads(workspace_id, created_at DESC) 
  WHERE status = 'new';

-- Index for job processing
CREATE INDEX idx_queue_jobs_processing 
  ON queue_jobs(queue_name, status, scheduled_at) 
  WHERE status IN ('pending', 'processing');

-- GIN index for JSONB custom fields search
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (custom_fields);

-- Full text search on email body
CREATE INDEX idx_email_messages_body_fts ON email_messages USING GIN (to_tsvector('english', body));

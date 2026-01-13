# Architecture Documentation

## System Overview

AI Cold Email Bot is a multi-service microservices architecture for automated cold email campaigns with AI-powered personalization and reply management.

## Architecture Diagram

```
┌─────────────┐
│  Telegram   │
│   Users     │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────────────┐
│             Telegram Bot Service                 │
│  - Scene-based UI                               │
│  - File upload handling                         │
│  - Menu navigation                              │
└──────┬──────────────────────────────────────────┘
       │
       v
┌─────────────────────────────────────────────────┐
│              Core API Service                    │
│  - REST API endpoints                           │
│  - Business logic                               │
│  - Queue job creation                           │
│  - Campaign management                          │
└──────┬──────────────────────────────────────────┘
       │
       ├────────────────┬───────────────┬─────────┐
       v                v               v         v
┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Worker  │    │  Gmail   │   │    AI    │   │  Observ. │
│ Service  │    │ Service  │   │Orchestr. │   │ Service  │
│          │    │          │   │          │   │          │
│- Generate│    │- OAuth   │   │- OpenAI  │   │- Metrics │
│- Send    │    │- Send    │   │- MCP     │   │- Prom.   │
│- Followup│    │- Watch   │   │- Classify│   │          │
│- Classify│    │- Webhook │   │          │   │          │
│- Notify  │    │          │   │          │   │          │
└────┬─────┘    └────┬─────┘   └────┬─────┘   └──────────┘
     │               │              │
     └───────┬───────┴──────┬───────┘
             v              v
     ┌──────────────┐  ┌──────────┐
     │  PostgreSQL  │  │  Redis   │
     │   Database   │  │  Queue   │
     └──────────────┘  └──────────┘
```

## Service Responsibilities

### Telegram Bot Service

**Purpose:** User interface via Telegram

**Key Features:**
- Scene-based conversation flows
- File upload handling (CSV contacts)
- Menu-driven navigation
- Real-time lead notifications
- Live reply functionality

**Technology:**
- Node.js + TypeScript
- Telegraf framework
- Form-data for file handling

### Core API Service

**Purpose:** Central business logic and API gateway

**Key Features:**
- RESTful API endpoints
- Campaign management
- Contact management
- Billing and balance tracking
- Job queue coordination

**Technology:**
- Express.js
- PostgreSQL client
- Redis client
- Zod validation

### Worker Service

**Purpose:** Background job processing

**Key Features:**
- Generate jobs: AI email generation
- Send jobs: Email sending with billing
- Followup jobs: Delayed follow-ups with reply detection
- Classify jobs: AI reply classification
- Notify jobs: Telegram notifications

**Technology:**
- Bull/BullMQ for job queues
- Redis for job storage
- Retry logic with exponential backoff

### Gmail Service

**Purpose:** Gmail integration and email operations

**Key Features:**
- Gmail account pool management
- OAuth 2.0 authentication
- Email sending via Gmail API
- Push notifications via Pub/Sub
- Account status tracking

**Technology:**
- Google APIs Node.js client
- Express.js for webhook endpoint
- PostgreSQL for account data

### AI Orchestrator Service

**Purpose:** AI-powered email generation and classification

**Key Features:**
- OpenAI integration
- MCP (Model Context Protocol) tools
- Email generation pipeline
- Reply classification
- Compliance checking

**Technology:**
- OpenAI SDK
- Custom MCP tool implementations
- Perplexity API (optional)

### Observability Service

**Purpose:** Monitoring and metrics

**Key Features:**
- Prometheus metrics export
- System health monitoring
- Job queue metrics
- Campaign statistics

**Technology:**
- Prometheus client
- Express.js

## Data Flow

### Campaign Creation Flow

```
1. User creates campaign in Telegram
2. Telegram Bot → Core API: POST /api/campaigns
3. Core API creates campaign in PostgreSQL
4. User adds recipients
5. User starts campaign
6. Core API creates generate jobs in Redis queue
7. Worker picks up generate jobs
8. Worker → AI Orchestrator: Generate emails
9. Worker creates send jobs
10. Worker picks up send jobs
11. Worker → Gmail Service: Send emails
12. Gmail Service sends via Gmail API
13. Worker updates billing in PostgreSQL
```

### Reply Processing Flow

```
1. Gmail receives reply
2. Gmail → Pub/Sub → Gmail Service webhook
3. Gmail Service fetches new messages
4. Gmail Service creates classify job
5. Worker picks up classify job
6. Worker → AI Orchestrator: Classify reply
7. If positive: Create lead in PostgreSQL
8. Worker creates notify job
9. Worker picks up notify job
10. Worker → Telegram Bot: Send notification
11. User receives lead notification in Telegram
```

### Live Reply Flow

```
1. User clicks "Reply" in Telegram lead
2. Telegram Bot prompts for message
3. User types reply
4. Telegram Bot → Core API: POST /api/leads/{id}/reply
5. Core API → Gmail Service: Send reply in thread
6. Gmail Service sends via Gmail API
7. Core API updates lead status
```

## Database Schema

### Core Tables

**workspaces**
- id (uuid, PK)
- name
- owner_telegram_id
- created_at

**users**
- id (uuid, PK)
- workspace_id (FK)
- telegram_id (unique)
- created_at

**contacts**
- id (uuid, PK)
- workspace_id (FK)
- email (unique per workspace)
- first_name, last_name
- company, website
- created_at

**campaigns**
- id (uuid, PK)
- workspace_id (FK)
- name
- prompt_profile_id (FK)
- status (draft, active, paused, completed)
- created_at

**campaign_steps**
- id (uuid, PK)
- campaign_id (FK)
- step_number
- template
- delay_hours

**campaign_recipients**
- id (uuid, PK)
- campaign_id (FK)
- contact_id (FK)
- status (pending, sent, replied, failed)
- current_step

**leads**
- id (uuid, PK)
- campaign_id (FK)
- contact_id (FK)
- status (new, taken, replied, closed)
- taken_by_telegram_id
- created_at

**email_messages**
- id (uuid, PK)
- campaign_recipient_id (FK)
- gmail_account_id (FK)
- thread_id
- message_id
- direction (outbound, inbound)
- subject, body
- sent_at, received_at

**queue_jobs**
- id (uuid, PK)
- queue_name
- job_data (jsonb)
- status (pending, running, completed, failed)
- attempts
- created_at, started_at, completed_at

## Queue Architecture

### Queue Types

1. **generate** - Email generation with AI
2. **send** - Email sending via Gmail
3. **followup** - Delayed follow-ups
4. **classify** - Reply classification
5. **notify** - Telegram notifications

### Job Processing

```typescript
// Job structure
interface Job {
  id: string
  queue: string
  data: any
  attempts: number
  maxAttempts: number
  delay: number
}

// Retry strategy
const retryDelay = Math.min(
  1000 * Math.pow(2, attempts),
  3600000 // max 1 hour
)
```

## Security Considerations

### Authentication
- Telegram bot token for bot auth
- Google OAuth for Gmail access
- OpenAI API key for AI features
- Future: JWT for API authentication

### Data Protection
- Environment variables for secrets
- Database credentials not in code
- HTTPS for production
- Webhook signature verification

### Rate Limiting
- Gmail API rate limits
- OpenAI API rate limits
- Per-workspace sending limits
- Redis-based rate limiting

## Scalability

### Horizontal Scaling
- Worker service: Scale to N instances
- Core API: Scale with load balancer
- Gmail Service: Scale with account pool

### Vertical Scaling
- PostgreSQL: Connection pooling
- Redis: Memory optimization
- Worker: Job concurrency tuning

### Performance Optimization
- Database indexing on frequent queries
- Redis caching for hot data
- Batch processing for bulk operations
- Async job processing

## Monitoring & Observability

### Metrics
- Request rate and latency
- Queue depth and processing time
- Email send success rate
- AI generation success rate
- Database connection pool usage

### Logging
- Structured JSON logging
- Request ID tracking
- Job ID tracking
- Error stack traces

### Alerting
- Queue depth threshold
- Email send failure rate
- Database connection errors
- Service health check failures

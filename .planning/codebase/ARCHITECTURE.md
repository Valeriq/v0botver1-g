# Architecture Analysis: AI Cold Email Bot

## Executive Summary

This codebase implements a **microservices architecture** for an AI-powered cold email automation platform. The system is designed as a Telegram-based SaaS application that orchestrates email campaigns, manages Gmail integrations, and leverages AI for email generation and reply classification.

---

## 1. High-Level Architecture Pattern

### Pattern: Event-Driven Microservices

The system follows an **event-driven microservices architecture** with these key characteristics:

- **Presentation Layer:** Telegram Bot Service (scene-based UI)
- **API Gateway Layer:** Core API Service (REST endpoints, business logic)
- **Service Layer:** Worker, Gmail Service, AI Orchestrator, Observability
- **Data Layer:** PostgreSQL (primary store), Redis (queues, caching)

---

## 2. Service Boundaries and Responsibilities

### 2.1 Telegram Bot Service (Port 8080)
**Location:** `services/telegram-bot/`

**Framework:** Telegraf.js with Scenes

**Responsibility:** User interface via Telegram

**Key Components:**
- Handlers: `/start`, `/menu`, `/admin`, `/metrics` commands
- Scenes: Contacts, AI Settings, Campaigns, Leads, Balance, Admin, Metrics
- Features: CSV upload, scene-based wizards, real-time notifications, live reply

### 2.2 Core API Service (Port 3000)
**Location:** `services/core-api/`

**Framework:** Express.js

**Responsibility:** Central business logic and API gateway

**Key Routes:**
- `/api/workspaces` - Workspace management
- `/api/contacts` - Contact CRUD operations
- `/api/suppression` - Suppression list management
- `/api/prompt-profiles` - AI prompt configuration
- `/api/campaigns` - Campaign lifecycle management
- `/api/leads` - Lead tracking and management
- `/api/billing` - Balance and ledger operations
- `/api/admin` - Administrative functions
- `/api/metrics` - System metrics

**Middleware Stack:** CORS, JSON parser, Request logger, Rate limiting, Error handler

### 2.3 Worker Service (Port 8081)
**Location:** `services/worker/`

**Pattern:** Queue-based job processor

**Responsibility:** Background job processing

**Queue Processors:**

| Queue | Purpose | Flow |
|-------|---------|------|
| `generate` | AI email generation | Fetches campaign/contact, calls AI Orchestrator, queues send job |
| `send` | Email delivery | Selects Gmail account, sends via Gmail Service, updates billing |
| `followup` | Delayed follow-ups | Checks for replies, queues next step generation |
| `classify` | Reply classification | Calls AI Orchestrator, creates leads for positive replies |
| `notify` | Telegram notifications | Sends lead notifications to users |

**Retry Strategy:** Exponential backoff (max 60s), max 3 attempts

### 2.4 Gmail Service (Port 3001)
**Location:** `services/gmail-service/`

**Framework:** Express.js

**Responsibility:** Gmail API integration

**Key Features:**
- OAuth 2.0 authentication flow
- Gmail account pool management
- Email sending via Gmail API
- Push notifications via Google Pub/Sub
- Account status tracking (ok, limit, blocked, auth_failed)

### 2.5 AI Orchestrator Service (Port 3002)
**Location:** `services/ai-orchestrator/`

**Framework:** Express.js

**Responsibility:** AI-powered operations

**Key Features:**
- OpenAI GPT-4 integration
- MCP (Model Context Protocol) tools
- Email generation pipeline
- Reply classification
- Compliance checking

**MCP Tools:**
- `db_read` - Database queries for personalization
- `policy_check` - Anti-spam compliance verification
- `perplexity_search` - External research integration

### 2.6 Shared Package
**Location:** `packages/shared/`

**Exports:**
- `types.ts` - TypeScript interfaces (Workspace, User, Contact, Campaign, QueueJob)
- `schema.ts` - Zod validation schemas
- `routes.ts` - Shared route definitions
- `logger.ts` - Logging utilities

---

## 3. Data Flow Between Services

### 3.1 Campaign Creation Flow
1. User creates campaign in Telegram
2. Telegram Bot -> Core API: POST /api/campaigns
3. Core API creates campaign in PostgreSQL
4. User adds recipients via CSV upload
5. User starts campaign
6. Core API creates generate jobs in Redis queue
7. Worker picks up generate jobs
8. Worker -> AI Orchestrator: Generate emails
9. Worker creates send jobs
10. Worker picks up send jobs
11. Worker -> Gmail Service: Send emails
12. Gmail Service sends via Gmail API
13. Worker updates billing in PostgreSQL

### 3.2 Reply Processing Flow
1. Gmail receives reply
2. Gmail -> Pub/Sub -> Gmail Service webhook
3. Gmail Service fetches new messages
4. Gmail Service creates classify job
5. Worker picks up classify job
6. Worker -> AI Orchestrator: Classify reply
7. If positive: Create lead in PostgreSQL
8. Worker creates notify job
9. Worker picks up notify job
10. Worker -> Telegram Bot: Send notification
11. User receives lead notification in Telegram

---

## 4. Communication Patterns

### 4.1 Synchronous Communication (HTTP/REST)

| Source | Target | Endpoint | Purpose |
|--------|--------|----------|---------|
| Telegram Bot | Core API | `POST /api/*` | All business operations |
| Worker | AI Orchestrator | `POST /api/generate/email` | Email generation |
| Worker | AI Orchestrator | `POST /api/classify/reply` | Reply classification |
| Worker | Gmail Service | `POST /api/send` | Email sending |
| Gmail Service | Gmail API | Google APIs | Email operations |

### 4.2 Asynchronous Communication (Redis Queues)

| Queue Name | Producer | Consumer |
|------------|----------|----------|
| `queue:generate` | Core API | Worker |
| `queue:send` | Worker (generate) | Worker |
| `queue:followup` | Worker (send) | Worker |
| `queue:classify` | Gmail Service | Worker |
| `queue:notify` | Worker (classify) | Worker |

**Queue Implementation:**
```typescript
// Redis BLPOP for blocking queue consumption
const result = await redisClient.blPop(queueName, 5)
// RPUSH for job submission
await redisClient.rPush(queueName, JSON.stringify(job))
```

### 4.3 Webhook Communication

| Source | Target | Trigger |
|--------|--------|---------|
| Google Pub/Sub | Gmail Service | New email received |

---

## 5. Database Design Overview

### 5.1 Schema Organization
The database follows a **multi-tenant workspace model** with all data scoped to `workspace_id`.

### 5.2 Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `workspaces` | Tenant isolation | `id`, `telegram_user_id`, `token_balance` |
| `contacts` | Recipient data | `id`, `workspace_id`, `email`, `first_name`, `company` |
| `campaigns` | Campaign config | `id`, `workspace_id`, `status`, `prompt_profile_id` |
| `campaign_steps` | Follow-up sequence | `campaign_id`, `step_number`, `delay_days` |
| `campaign_recipients` | Recipient tracking | `campaign_id`, `contact_id`, `status` |
| `email_messages` | Sent/received emails | `thread_id`, `message_id`, `direction` |
| `leads` | Qualified responses | `workspace_id`, `contact_id`, `thread_id`, `status` |
| `gmail_accounts` | Sending accounts | `email`, `status`, `daily_limit` |
| `queue_jobs` | Job tracking | `queue`, `data`, `status`, `attempts` |
| `billing_ledger` | Token transactions | `workspace_id`, `amount`, `operation` |
| `ai_artifacts` | AI outputs | `workspace_id`, `type`, `content` |

### 5.3 Indexes
- `idx_workspaces_telegram_user_id` - Fast workspace lookup
- `idx_contacts_workspace_id` - Contact listing per workspace
- `idx_campaigns_status` - Active campaign queries
- `idx_email_messages_thread_id` - Thread-based lookups
- `idx_queue_jobs_queue_status` - Job queue filtering
- `idx_queue_jobs_scheduled_at` - Delayed job processing

---

## 6. Key Architectural Decisions

### 6.1 Microservices Decomposition
**Decision:** Split into 6 independent services based on bounded contexts.

**Rationale:**
- Telegram Bot: Isolated UI layer, replaceable with web/mobile
- Core API: Central business logic, single source of truth
- Worker: Horizontal scaling for background processing
- Gmail Service: External API isolation, credential management
- AI Orchestrator: AI provider abstraction, cost optimization

### 6.2 Queue-Based 
Job Processing
**Decision:** Redis-based queues with database job tracking.

**Rationale:**
- Decouples job creation from processing
- Enables horizontal worker scaling
- Provides job persistence and retry capability
- Allows job status tracking and debugging

### 6.3 Multi-Tenant Workspace Model
**Decision:** All data scoped to `workspace_id`.

**Rationale:**
- Natural fit for Telegram-based SaaS
- Data isolation between customers
- Simplifies billing and access control

### 6.4 Gmail Account Pool
**Decision:** Shared pool of Gmail accounts assigned to workspaces.

**Rationale:**
- Distributes sending load across multiple accounts
- Handles rate limits gracefully
- Provides redundancy for account issues

### 6.5 AI Abstraction Layer
**Decision:** Dedicated AI Orchestrator service with MCP tools.

**Rationale:**
- Centralizes AI provider integration
- Enables tool use (database queries, research)
- Provides compliance checking
- Allows model switching without affecting other services

### 6.6 Health Check Architecture
**Decision:** Multi-level health checks for all services.

**Implementation:**
- `/health` - Basic liveness
- `/health/live` - Kubernetes liveness probe
- `/health/ready` - Kubernetes readiness probe (checks dependencies)
- `/health/detailed` - Full health with response times

---

## 7. Cross-Cutting Concerns

### 7.1 Error Handling
- **Service Level:** Express error handler middleware
- **Job Level:** Retry with exponential backoff (max 3 attempts)
- **Database Level:** Connection pooling with error recovery
- **External APIs:** Axios timeout and error classification

### 7.2 Logging
- Structured JSON logging
- Request ID tracking
- Job ID tracking through pipeline
- Error stack traces

### 7.3 Security

| Concern | Implementation |
|---------|---------------|
| Authentication | Telegram bot token, Google OAuth |
| Secrets | Environment variables |
| Database | Parameterized queries |
| API | Rate limiting middleware |
| Webhooks | Signature verification (planned) |

### 7.4 Scalability

| Component | Scaling Strategy |
|-----------|-----------------|
| Worker | Horizontal (N instances) |
| Core API | Horizontal with load balancer |
| PostgreSQL | Connection pooling, read replicas |
| Redis | Clustering for high volume |

---

## 8. Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Runtime | Node.js 20+ |
| API Framework | Express.js |
| Telegram Bot | Telegraf.js with Scenes |
| Database | PostgreSQL 16 |
| Queue | Redis 7 |
| AI | OpenAI GPT-4, Perplexity |
| Email | Gmail API, Google Pub/Sub |
| Validation | Zod |
| HTTP Client | Axios |
| Containerization | Docker, Docker Compose |
| Package Manager | pnpm (monorepo) |

---

## 9. Deployment Architecture

**Docker Compose Stack:**
- postgres:5432 (PostgreSQL 16)
- redis:6379 (Redis 7)
- core-api:3000 (Express.js)
- telegram-bot:8080 (Telegraf.js)
- worker:8081 (Job processor)
- gmail-service:3001 (Gmail API)
- ai-orchestrator:3002 (OpenAI)

**Volumes:** postgres_data
**Network:** default bridge

---

## 10. Future Considerations

### Identified Gaps (from README.md)

1. **Authentication/Authorization** - JWT-based API auth needed
2. **Rate Limiting** - Per-user limits beyond API-level
3. **Error Monitoring** - Sentry integration recommended
4. **Metrics** - Prometheus/Grafana setup
5. **Horizontal Scaling** - Worker auto-scaling
6. **Database Tuning** - Connection pooling optimization
7. **Redis Clustering** - For high-volume production
8. **Token Refresh** - Gmail OAuth automation
9. **Webhook Security** - Signature verification
10. **HTTPS/TLS** - Production encryption
11. **Secrets Management** - Vault/AWS Secrets Manager
12. **CI/CD** - Automated deployment pipeline
13. **Testing** - Unit and integration test coverage
14. **Load Testing** - Performance validation

---

*Document generated from codebase analysis on 2026-03-07*

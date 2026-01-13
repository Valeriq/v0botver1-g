# AI Cold Email Bot MVP

Telegram-based SaaS for AI-powered cold email campaigns with multi-step follow-ups, Gmail integration, and live reply management.

## Architecture

This project consists of multiple microservices:

- **core-api** (port 3000): REST API, business logic, campaigns, contacts, billing
- **telegram-bot**: Telegram UI with scenes for contacts, campaigns, leads, and balance
- **worker**: Background job processor for generate, send, followup, classify, notify queues
- **gmail-service** (port 3001): Gmail OAuth, sending, push notifications via Pub/Sub
- **ai-orchestrator** (port 3002): OpenAI integration, email generation, reply classification
- **postgres** (port 5432): PostgreSQL database with full schema
- **redis** (port 6379): Job queues and caching

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Telegram Bot Token (get from @BotFather)
- OpenAI API Key (for AI features)
- Google OAuth credentials (for Gmail integration)

### Setup

1. Clone the repository

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure required environment variables in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   OPENAI_API_KEY=your_openai_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Start all services:
   ```bash
   docker-compose up --build
   ```

5. Run database migrations:
   ```bash
   docker-compose exec core-api npm run migrate
   ```

### Service Endpoints

- Core API: http://localhost:3000/health
- Gmail Service: http://localhost:3001/health
- AI Orchestrator: http://localhost:3002/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Usage

### 1. Create Workspace
- Open your Telegram bot
- Send `/start` to create a workspace

### 2. Upload Contacts
- Send `/menu` and select "Base kontaktov"
- Upload CSV file with columns: email, first_name, last_name, company, website

### 3. Create Prompt Profile
- Go to "AI nastroyki"
- Create a prompt profile with system instructions for email generation

### 4. Create Campaign
- Use API to create campaign with steps:
  ```bash
  curl -X POST http://localhost:3000/api/campaigns \
    -H "Content-Type: application/json" \
    -d '{
      "workspace_id": "your_workspace_id",
      "name": "My Campaign",
      "prompt_profile_id": "your_profile_id",
      "steps": [
        {"template": "Initial outreach", "delay_hours": 0},
        {"template": "Follow-up 1", "delay_hours": 48},
        {"template": "Follow-up 2", "delay_hours": 96}
      ]
    }'
  ```

5. Add recipients and start campaign via API

### 5. Manage Leads
- Receive notifications in Telegram when someone replies
- View lead details and conversation history
- Take lead and reply in live mode directly from Telegram

## Project Structure

```
.
├── services/
│   ├── core-api/           # Main REST API
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints
│   │   │   ├── lib/        # Queue utilities
│   │   │   └── db/         # Database migrations
│   │   └── Dockerfile
│   ├── telegram-bot/       # Telegram interface
│   │   ├── src/
│   │   │   ├── handlers/   # Command handlers
│   │   │   └── scenes/     # Conversation scenes
│   │   └── Dockerfile
│   ├── worker/             # Background jobs
│   │   ├── src/
│   │   │   └── processors/ # Job processors
│   │   └── Dockerfile
│   ├── gmail-service/      # Gmail operations
│   │   ├── src/
│   │   │   ├── routes/     # Send, accounts, watch, webhook
│   │   │   └── lib/        # Gmail client
│   │   └── Dockerfile
│   └── ai-orchestrator/    # AI features
│       ├── src/
│       │   ├── routes/     # Generate, classify
│       │   └── lib/        # OpenAI, MCP tools
│       └── Dockerfile
├── packages/
│   └── shared/             # Shared TypeScript types
├── docker-compose.yml      # Full stack orchestration
└── .env.example           # Environment template
```

## Features Implemented

### Core Features
- [x] Multi-service architecture with Docker Compose
- [x] PostgreSQL database with full schema (workspaces, contacts, campaigns, leads, etc.)
- [x] Redis-based job queues with retry logic
- [x] Telegram bot with scene-based navigation

### Contact Management
- [x] CSV/TSV upload with validation and deduplication
- [x] Suppression list management
- [x] Contact listing and search

### Campaign Management
- [x] Multi-step campaign creation
- [x] Recipient management with suppression filtering
- [x] Campaign start/pause controls
- [x] Stats tracking (sent, replied, failed)

### Gmail Integration
- [x] Gmail account pool management
- [x] OAuth authentication support
- [x] Email sending via Gmail API
- [x] Push notifications via Pub/Sub webhook
- [x] Account status tracking (ok, limit, blocked, auth_failed)
- [x] Account assignment to workspaces

### AI Features
- [x] OpenAI integration for email generation
- [x] AI-powered reply classification
- [x] MCP tools (database read, policy check, Perplexity search)
- [x] Compliance checking for spam words
- [x] Artifact storage for generated content

### Queue System
- [x] Generate queue (AI email generation)
- [x] Send queue (Gmail sending with billing)
- [x] Followup queue (delayed follow-ups with reply detection)
- [x] Classify queue (AI reply classification)
- [x] Notify queue (Telegram notifications)
- [x] Retry logic with exponential backoff
- [x] Job status tracking in database

### Lead Management
- [x] Automatic lead creation from positive replies
- [x] Lead status tracking (new, taken, replied, closed)
- [x] Thread conversation history
- [x] Telegram notifications for new leads
- [x] Live reply mode - respond directly from Telegram
- [x] Take lead functionality with ownership tracking

### Billing
- [x] Balance tracking per workspace
- [x] Ledger with credit/debit entries
- [x] Automatic deduction on email send
- [x] Insufficient balance checks

### Telegram Bot Scenes
- [x] Contacts scene (upload CSV, view contacts)
- [x] AI scene (create/manage prompt profiles)
- [x] Campaigns scene (view campaigns)
- [x] Leads scene (view, take, reply to leads)
- [x] Balance scene (view balance and transaction history)

## API Endpoints

### Core API (port 3000)

**Workspaces**
- `POST /api/workspaces` - Create workspace

**Contacts**
- `POST /api/contacts/upload` - Upload CSV/TSV
- `GET /api/contacts` - List contacts
- `DELETE /api/contacts/:id` - Delete contact

**Suppression**
- `POST /api/suppression` - Add to suppression list
- `GET /api/suppression` - List suppressed emails
- `DELETE /api/suppression/:id` - Remove from suppression

**Prompt Profiles**
- `POST /api/prompt-profiles` - Create profile
- `GET /api/prompt-profiles` - List profiles
- `PUT /api/prompt-profiles/:id` - Update profile
- `DELETE /api/prompt-profiles/:id` - Delete profile

**Campaigns**
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign with stats
- `POST /api/campaigns/:id/status` - Start/pause campaign
- `POST /api/campaigns/:id/recipients` - Add recipients

**Leads**
- `GET /api/leads` - List leads
- `GET /api/leads/:id` - Get lead details with thread
- `POST /api/leads/:id/take` - Take lead
- `POST /api/leads/:id/reply` - Send live reply
- `POST /api/leads/:id/close` - Close lead

**Billing**
- `GET /api/billing/balance` - Get workspace balance
- `GET /api/billing/ledger` - Get transaction history
- `POST /api/billing/credit` - Add credits
- `POST /api/billing/deduct` - Deduct for usage

### Gmail Service (port 3001)

- `POST /api/send` - Send email via Gmail
- `GET /api/accounts` - List Gmail accounts
- `POST /api/accounts` - Add Gmail account
- `PATCH /api/accounts/:id/status` - Update account status
- `POST /api/accounts/assign` - Assign account to workspace
- `GET /api/accounts/workspace/:id` - Get workspace accounts
- `POST /api/watch/setup` - Setup Gmail push notifications
- `POST /webhook/pubsub` - Gmail push webhook endpoint

### AI Orchestrator (port 3002)

- `POST /api/generate/email` - Generate email with AI
- `POST /api/classify/reply` - Classify reply with AI
- `POST /api/classify/batch` - Batch classify messages

## Database Schema

Full schema includes 15+ tables:
- workspaces, users
- contacts, suppression_list
- campaigns, campaign_steps, campaign_recipients
- prompt_profiles
- gmail_accounts, account_assignments
- email_messages, reply_events
- leads
- ai_artifacts
- billing_ledger
- queue_jobs

See `services/core-api/src/db/migrations/` for full schema.

## Development

### Local Development

Run individual services:
```bash
cd services/core-api
npm install
npm run dev
```

### Run Tests

```bash
# Unit tests (TODO)
npm test

# Integration tests (TODO)
npm run test:integration
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f worker
```

## Environment Variables

See `.env.example` for all required variables:

**Required:**
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

**Optional:**
- `PERPLEXITY_API_KEY` - For research features
- `OPENAI_MODEL` - Default: gpt-4o-mini
- `GMAIL_PUBSUB_TOPIC` - Gmail push topic name

## Troubleshooting

### Services not starting
```bash
docker-compose down -v
docker-compose up --build
```

### Database connection issues
```bash
docker-compose exec postgres psql -U postgres -d cold_email_bot
```

### Redis connection issues
```bash
docker-compose exec redis redis-cli ping
```

### Worker not processing jobs
Check logs: `docker-compose logs -f worker`
Verify Redis connection: `docker-compose exec redis redis-cli LLEN queue:generate`

## Production Considerations

This is an MVP. For production, add:

- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Input validation with Zod
- [ ] Error monitoring (Sentry)
- [ ] Metrics and observability (Prometheus/Grafana)
- [ ] Horizontal scaling for workers
- [ ] Database connection pooling tuning
- [ ] Redis clustering
- [ ] Gmail token refresh automation
- [ ] Webhook signature verification
- [ ] HTTPS/TLS everywhere
- [ ] Secrets management (Vault, AWS Secrets Manager)
- [ ] CI/CD pipeline
- [ ] Unit and integration tests
- [ ] Load testing

## License

Proprietary

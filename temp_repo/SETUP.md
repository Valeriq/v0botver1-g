# AI Cold Email Bot - Setup Guide

Complete setup instructions for local development and production deployment.

## Prerequisites

### Required Software
- Docker Desktop 24+ (includes Docker Compose)
- Node.js 20+ (for local development without Docker)
- Git

### Required API Keys
1. **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)
2. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)
3. **Google OAuth Credentials** - Get from [Google Cloud Console](https://console.cloud.google.com)

### Optional API Keys
- **Perplexity API Key** - For research features

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-cold-email-bot
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ADMIN_TELEGRAM_IDS=123456789
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

### 3. Start Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will:
- Start PostgreSQL and Redis
- Run database migrations automatically
- Start all microservices in development mode with hot-reload

### 4. Verify Setup
Check all services are healthy:
```bash
curl http://localhost:3000/health  # Core API
curl http://localhost:3001/health  # Gmail Service
curl http://localhost:3002/health  # AI Orchestrator
curl http://localhost:9090/metrics # Observability
```

### 5. Test Telegram Bot
1. Open Telegram and find your bot
2. Send `/start` - should create workspace
3. Send `/menu` - should show main menu

## Detailed Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/oauth/callback`
   - Copy Client ID and Client Secret to `.env`

5. Configure OAuth consent screen:
   - Add your email as test user
   - Add scopes: `gmail.send`, `gmail.readonly`

### Gmail Push Notifications (Optional)

For production, set up Gmail push notifications:

1. Create Pub/Sub topic in Google Cloud:
```bash
gcloud pubsub topics create gmail-push
```

2. Grant Gmail permission:
```bash
gcloud pubsub topics add-iam-policy-binding gmail-push \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Create subscription:
```bash
gcloud pubsub subscriptions create gmail-push-sub \
  --topic=gmail-push \
  --push-endpoint=https://your-domain.com/webhook/pubsub
```

4. Update `.env`:
```env
GMAIL_PUBSUB_TOPIC=projects/your-project/topics/gmail-push
```

### Database Management

#### Manual Migrations
```bash
# Run all migrations
docker-compose -f docker-compose.dev.yml exec core-api npm run migrate

# Connect to database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d cold_email_bot

# View tables
\dt

# View specific table
SELECT * FROM workspaces;
```

#### Backup Database
```bash
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres cold_email_bot > backup.sql
```

#### Restore Database
```bash
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres cold_email_bot < backup.sql
```

### Development Workflow

#### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f worker

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 core-api
```

#### Restart Service
```bash
docker-compose -f docker-compose.dev.yml restart worker
```

#### Rebuild Service
```bash
docker-compose -f docker-compose.dev.yml up -d --build core-api
```

#### Stop All Services
```bash
docker-compose -f docker-compose.dev.yml down
```

#### Clean Everything (including volumes)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Local Development (without Docker)

If you prefer running services locally:

#### 1. Start Infrastructure
```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

#### 2. Install Dependencies
```bash
npm install
cd services/core-api && npm install
cd ../telegram-bot && npm install
cd ../worker && npm install
cd ../gmail-service && npm install
cd ../ai-orchestrator && npm install
```

#### 3. Run Migrations
```bash
cd services/core-api
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cold_email_bot
npm run migrate
```

#### 4. Start Services (in separate terminals)
```bash
# Terminal 1 - Core API
cd services/core-api
npm run dev

# Terminal 2 - Telegram Bot
cd services/telegram-bot
npm run dev

# Terminal 3 - Worker
cd services/worker
npm run dev

# Terminal 4 - Gmail Service
cd services/gmail-service
npm run dev

# Terminal 5 - AI Orchestrator
cd services/ai-orchestrator
npm run dev
```

## Testing the System

### 1. Create Workspace
```bash
# In Telegram
/start
```

### 2. Upload Contacts
Create a CSV file `contacts.csv`:
```csv
email,first_name,last_name,company,website
john@example.com,John,Doe,Example Corp,example.com
jane@test.com,Jane,Smith,Test Inc,test.com
```

In Telegram:
1. Send `/menu`
2. Select "Base kontaktov"
3. Select "Zagruzit CSV"
4. Upload `contacts.csv`

### 3. Create Prompt Profile
```bash
# In Telegram
/menu -> AI nastroyki -> Sozdat profil

# Enter:
Name: Cold Outreach
Instructions: Write professional cold emails. Be concise and value-focused.
```

### 4. Create Campaign (via API)
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "<your-workspace-id>",
    "name": "Test Campaign",
    "prompt_profile_id": "<your-profile-id>",
    "steps": [
      {"template": "Initial outreach", "delay_hours": 0},
      {"template": "Follow-up", "delay_hours": 48}
    ]
  }'
```

### 5. Add Recipients
```bash
curl -X POST http://localhost:3000/api/campaigns/<campaign-id>/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": ["<contact-id-1>", "<contact-id-2>"]
  }'
```

### 6. Start Campaign
```bash
curl -X POST http://localhost:3000/api/campaigns/<campaign-id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### 7. Monitor Progress
```bash
# View queue jobs
docker-compose -f docker-compose.dev.yml exec redis redis-cli LLEN queue:generate

# View worker logs
docker-compose -f docker-compose.dev.yml logs -f worker

# Check metrics in Telegram
/menu -> Admin Panel -> Sistema
```

## Troubleshooting

### Services Won't Start
```bash
# Check Docker status
docker ps

# Check service logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild everything
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

### Database Connection Errors
```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.dev.yml exec postgres pg_isready

# Check connection
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "SELECT 1"
```

### Redis Connection Errors
```bash
# Verify Redis is running
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

### Telegram Bot Not Responding
1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Check telegram-bot logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f telegram-bot
```
3. Restart bot:
```bash
docker-compose -f docker-compose.dev.yml restart telegram-bot
```

### Worker Not Processing Jobs
1. Check worker logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f worker
```
2. Verify Redis queue:
```bash
docker-compose -f docker-compose.dev.yml exec redis redis-cli LLEN queue:generate
```
3. Check job status in database:
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d cold_email_bot -c "SELECT * FROM queue_jobs ORDER BY created_at DESC LIMIT 10;"
```

### Gmail Integration Issues
1. Verify OAuth credentials are correct
2. Check redirect URI matches exactly: `http://localhost:3001/oauth/callback`
3. Ensure Gmail API is enabled in Google Cloud Console
4. Check gmail-service logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f gmail-service
```

### AI Generation Failing
1. Verify `OPENAI_API_KEY` is valid
2. Check AI Orchestrator logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f ai-orchestrator
```
3. Test OpenAI API directly:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Production Deployment

For production deployment, see [DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- Environment configuration
- Secrets management
- Scaling strategies
- Monitoring setup
- Backup procedures

## Support

If you encounter issues not covered in this guide:
1. Check logs for all services
2. Verify all environment variables are set correctly
3. Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand system flow
4. Check [API.md](docs/API.md) for endpoint documentation
```

```makefile file="Makefile"
.PHONY: help start stop restart logs build clean test migrate db-shell redis-shell

help:
	@echo "AI Cold Email Bot - Available Commands"
	@echo ""
	@echo "  make start       - Start all services in development mode"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make build       - Rebuild all Docker images"
	@echo "  make clean       - Stop and remove all containers and volumes"
	@echo "  make test        - Run tests"
	@echo "  make migrate     - Run database migrations"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo "  make redis-shell - Open Redis shell"

start:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started. Access:"
	@echo "  Core API: http://localhost:3000/health"
	@echo "  Gmail Service: http://localhost:3001/health"
	@echo "  AI Orchestrator: http://localhost:3002/health"
	@echo "  Metrics: http://localhost:9090/metrics"

stop:
	docker-compose -f docker-compose.dev.yml down

restart:
	docker-compose -f docker-compose.dev.yml restart

logs:
	docker-compose -f docker-compose.dev.yml logs -f

build:
	docker-compose -f docker-compose.dev.yml build

clean:
	docker-compose -f docker-compose.dev.yml down -v
	@echo "All services stopped and volumes removed"

test:
	docker-compose -f docker-compose.dev.yml exec core-api npm test

migrate:
	@echo "Running database migrations..."
	docker-compose -f docker-compose.dev.yml up -d db-init
	@echo "Migrations complete"

db-shell:
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d cold_email_bot

redis-shell:
	docker-compose -f docker-compose.dev.yml exec redis redis-cli

status:
	@echo "Service Status:"
	@docker-compose -f docker-compose.dev.yml ps

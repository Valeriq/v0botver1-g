# Local Deployment Guide (Native)

This guide explains how to run the AI Cold Email Bot system locally without Docker.

## Prerequisites

- **Node.js**: 20+
- **pnpm**: 10+
- **PostgreSQL**: 16+
- **Redis**: 7+

## 1. Setup Infrastructure

Ensure PostgreSQL and Redis are running locally.

### PostgreSQL
Create a database and a user:
```sql
CREATE DATABASE cold_email_bot;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE cold_email_bot TO postgres;
```

### Redis
Ensure Redis is running on default port 6379.

## 2. Configure Environment

Create a `.env` file in the root directory:
```env
TELEGRAM_BOT_TOKEN=your_token
ADMIN_TELEGRAM_IDS=your_id
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/callback
GMAIL_PUBSUB_TOPIC=projects/your-project/topics/gmail-push
PERPLEXITY_API_KEY=your_perplexity_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cold_email_bot
REDIS_URL=redis://localhost:6379
CORE_API_URL=http://localhost:3000
GMAIL_SERVICE_URL=http://localhost:3001
AI_ORCHESTRATOR_URL=http://localhost:3002
```

## 3. Install and Build

Install dependencies for all packages and services:
```bash
pnpm install
```

Build all packages:
```bash
pnpm -r build
```

## 4. Run Migrations

Run database migrations to set up the schema:
```bash
cd services/core-api
pnpm migrate
```

## 5. Run Services

You need to start each service in a separate terminal or use a process manager like `pm2`.

### Core API (Port 3000)
```bash
cd services/core-api
pnpm dev
```

### Gmail Service (Port 3001)
```bash
cd services/gmail-service
pnpm dev
```

### AI Orchestrator (Port 3002)
```bash
cd services/ai-orchestrator
pnpm dev
```

### Telegram Bot (Port 8080)
```bash
cd services/telegram-bot
pnpm dev
```

### Worker
```bash
cd services/worker
pnpm dev
```

## 6. Verification

Check if services are healthy:
- http://localhost:3000/health
- http://localhost:3001/health
- http://localhost:3002/health
- http://localhost:8081/health (Worker health)

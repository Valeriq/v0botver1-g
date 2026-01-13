# Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed on production server
- Domain name with DNS configured
- SSL certificates (Let's Encrypt recommended)
- PostgreSQL 16+ (managed or self-hosted)
- Redis 7+ (managed or self-hosted)
- Google Cloud Project with Gmail API enabled
- OpenAI API key

### Environment Setup

1. Create production `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@db-host:5432/cold_email_bot

# Redis
REDIS_URL=redis://redis-host:6379

# Telegram
TELEGRAM_BOT_TOKEN=your_production_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback

# Gmail Push
GMAIL_PUBSUB_TOPIC=projects/your-project/topics/gmail-push
GMAIL_PUBSUB_SUBSCRIPTION=gmail-push-subscription

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Perplexity (optional)
PERPLEXITY_API_KEY=your_perplexity_key

# Service URLs
CORE_API_URL=http://core-api:3000
GMAIL_SERVICE_URL=http://gmail-service:3001
AI_ORCHESTRATOR_URL=http://ai-orchestrator:3002

# Security
NODE_ENV=production
```

### Database Migration

Run migrations before starting services:

```bash
docker-compose exec core-api npm run migrate
```

### Google Cloud Setup

1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Set up Pub/Sub topic for Gmail push notifications:

```bash
gcloud pubsub topics create gmail-push
gcloud pubsub subscriptions create gmail-push-subscription --topic=gmail-push
```

5. Grant Gmail API access to your service account

### SSL/TLS Configuration

Use nginx as reverse proxy with Let's Encrypt:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /webhook/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  core-api:
    image: cold-email-bot/core-api:latest
    restart: always
    env_file: .env
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  telegram-bot:
    image: cold-email-bot/telegram-bot:latest
    restart: always
    env_file: .env
    depends_on:
      - core-api

  worker:
    image: cold-email-bot/worker:latest
    restart: always
    env_file: .env
    depends_on:
      - postgres
      - redis
      - core-api

  gmail-service:
    image: cold-email-bot/gmail-service:latest
    restart: always
    env_file: .env
    depends_on:
      - postgres
      - redis

  ai-orchestrator:
    image: cold-email-bot/ai-orchestrator:latest
    restart: always
    env_file: .env
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: cold_email_bot
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

Start production stack:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring

Set up monitoring with Prometheus and Grafana:

1. Add observability service to docker-compose
2. Configure Prometheus scraping
3. Import Grafana dashboards
4. Set up alerting rules

### Backup Strategy

#### Database Backups

```bash
# Daily backup script
docker-compose exec postgres pg_dump -U postgres cold_email_bot > backup_$(date +%Y%m%d).sql

# Automated backup with cron
0 2 * * * /path/to/backup-script.sh
```

#### Redis Persistence

Configure Redis AOF (Append Only File) for durability:

```
appendonly yes
appendfsync everysec
```

### Scaling

#### Horizontal Scaling

Scale worker processes:

```bash
docker-compose up -d --scale worker=3
```

#### Database Connection Pooling

Configure PgBouncer for connection pooling:

```ini
[databases]
cold_email_bot = host=postgres port=5432 dbname=cold_email_bot

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Security Checklist

- [ ] Use strong passwords for database and Redis
- [ ] Enable SSL/TLS for all external connections
- [ ] Set up firewall rules (allow only necessary ports)
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable rate limiting on API endpoints
- [ ] Implement request signing for webhooks
- [ ] Regularly update dependencies
- [ ] Set up intrusion detection
- [ ] Enable audit logging
- [ ] Use secrets management (AWS Secrets Manager, Vault)

### Troubleshooting

#### Service won't start

```bash
# Check logs
docker-compose logs -f service-name

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart service-name
```

#### Database connection issues

```bash
# Test database connection
docker-compose exec postgres psql -U postgres -d cold_email_bot -c "SELECT 1;"

# Check database logs
docker-compose logs postgres
```

#### Worker not processing jobs

```bash
# Check Redis queue
docker-compose exec redis redis-cli LLEN queue:generate

# Check worker logs
docker-compose logs -f worker
```

### Performance Tuning

#### PostgreSQL

```sql
-- Increase connection limit
ALTER SYSTEM SET max_connections = 200;

-- Tune memory
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

#### Redis

```
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Rollback Strategy

```bash
# Tag current version
docker tag cold-email-bot/core-api:latest cold-email-bot/core-api:v1.0.0

# Deploy new version
docker-compose pull
docker-compose up -d

# Rollback if needed
docker tag cold-email-bot/core-api:v1.0.0 cold-email-bot/core-api:latest
docker-compose up -d

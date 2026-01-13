# Troubleshooting Guide

## Common Issues

### Service Won't Start

#### Symptoms
- Container restarts repeatedly
- Health checks failing
- Connection timeouts

#### Solutions

1. Check logs:
```bash
# Docker Compose
docker-compose logs -f service-name

# Kubernetes
kubectl logs -f deployment/service-name -n cold-email-bot
```

2. Verify environment variables:
```bash
# Check if all required vars are set
docker-compose exec core-api env | grep -E 'DATABASE|REDIS|TELEGRAM'
```

3. Test database connection:
```bash
docker-compose exec postgres psql -U postgres -d cold_email_bot -c "SELECT 1;"
```

### Telegram Bot Not Responding

#### Symptoms
- Bot doesn't respond to /start
- Commands timeout
- No error messages

#### Solutions

1. Verify bot token:
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

2. Check webhook status (if using webhooks):
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

3. Check core-api connectivity:
```bash
docker-compose exec telegram-bot curl http://core-api:3000/health
```

4. View bot logs:
```bash
docker-compose logs -f telegram-bot | grep -i error
```

### Worker Not Processing Jobs

#### Symptoms
- Jobs stuck in pending status
- Queue length increasing
- No email generation

#### Solutions

1. Check Redis queue:
```bash
docker-compose exec redis redis-cli
> LLEN queue:generate
> LRANGE queue:generate 0 -1
```

2. Verify worker is running:
```bash
docker-compose ps worker
docker-compose logs worker
```

3. Check for failed jobs:
```sql
SELECT * FROM queue_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

4. Restart worker:
```bash
docker-compose restart worker
```

### Gmail API Errors

#### 401 Unauthorized

Token expired or invalid:

```bash
# Check account status
SELECT email, status, last_error FROM gmail_accounts WHERE status = 'error';

# Refresh tokens manually
docker-compose exec gmail-service npm run refresh-tokens
```

#### 429 Rate Limit

Daily limit reached:

```bash
# Check quota usage
SELECT email, daily_quota_used, last_reset FROM gmail_accounts;

# Reset quota (runs automatically at midnight)
UPDATE gmail_accounts SET daily_quota_used = 0, last_reset = NOW() WHERE last_reset < CURRENT_DATE;
```

#### 403 Insufficient Permissions

Missing Gmail API scopes:

1. Go to Google Cloud Console
2. Check OAuth consent screen scopes
3. Re-authenticate accounts

### Database Issues

#### Connection Pool Exhausted

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < now() - interval '5 minutes';
```

#### Slow Queries

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

#### Disk Space

```bash
# Check database size
docker-compose exec postgres psql -U postgres -c "\l+"

# Check table sizes
docker-compose exec postgres psql -U postgres -d cold_email_bot -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Vacuum to reclaim space
docker-compose exec postgres psql -U postgres -d cold_email_bot -c "VACUUM FULL;"
```

### AI Orchestrator Errors

#### OpenAI API Timeout

```bash
# Check API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Increase timeout in code
# Edit services/ai-orchestrator/src/lib/openai-client.ts
timeout: 60000 // 60 seconds
```

#### Rate Limits

```bash
# Check rate limit headers in logs
docker-compose logs ai-orchestrator | grep -i "rate limit"

# Implement exponential backoff
# Already configured in openai-client.ts
```

### Memory Issues

#### Out of Memory

```bash
# Check container memory usage
docker stats

# Increase memory limits in docker-compose.yml
mem_limit: 1g
mem_reservation: 512m
```

#### Memory Leaks

```bash
# Enable Node.js heap dump
docker-compose exec -e NODE_OPTIONS="--heapsnapshot-signal=SIGUSR2" core-api node

# Trigger heap dump
docker-compose kill -s SIGUSR2 core-api

# Analyze with Chrome DevTools
```

### Network Issues

#### Services Can't Communicate

```bash
# Test inter-service connectivity
docker-compose exec core-api curl http://gmail-service:3001/health
docker-compose exec worker curl http://ai-orchestrator:3002/health

# Check docker network
docker network ls
docker network inspect cold-email-bot_default
```

#### External API Unreachable

```bash
# Test outbound connectivity
docker-compose exec core-api curl -I https://api.openai.com
docker-compose exec gmail-service curl -I https://www.googleapis.com

# Check DNS
docker-compose exec core-api nslookup api.openai.com
```

## Debugging Tools

### Enable Debug Logging

```bash
# Set log level to debug
docker-compose up -e LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug
```

### Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d cold_email_bot

# Useful queries
\dt  # List tables
\d+ table_name  # Describe table

-- Active campaigns
SELECT id, name, status, created_at FROM campaigns WHERE status = 'active';

-- Recent emails
SELECT * FROM email_messages ORDER BY created_at DESC LIMIT 10;

-- Lead statistics
SELECT status, COUNT(*) FROM leads GROUP BY status;
```

### Redis Debugging

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check queue lengths
LLEN queue:generate
LLEN queue:send
LLEN queue:classify

# View job data
LRANGE queue:generate 0 0

# Clear queue
DEL queue:generate
```

### Performance Profiling

```bash
# Node.js profiling
docker-compose exec -e NODE_OPTIONS="--prof" core-api node

# Process prof file
node --prof-process isolate-*.log > processed.txt
```

## Error Codes

### HTTP Status Codes

- 400: Bad Request - Check request payload
- 401: Unauthorized - Invalid or missing authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 429: Rate Limited - Too many requests
- 500: Internal Server Error - Check logs
- 503: Service Unavailable - Service is down

### Custom Error Codes

- E_DB_CONN: Database connection failed
- E_REDIS_CONN: Redis connection failed
- E_GMAIL_AUTH: Gmail authentication failed
- E_GMAIL_QUOTA: Gmail quota exceeded
- E_AI_TIMEOUT: AI service timeout
- E_INVALID_CONTACT: Invalid contact data
- E_CAMPAIGN_NOT_FOUND: Campaign doesn't exist

## Health Checks

### Service Health Endpoints

```bash
# Check all services
curl http://localhost:3000/health  # Core API
curl http://localhost:3001/health  # Gmail Service
curl http://localhost:3002/health  # AI Orchestrator
curl http://localhost:9090/metrics # Observability
```

### Database Health

```sql
SELECT 
  datname,
  numbackends,
  xact_commit,
  xact_rollback,
  blks_read,
  blks_hit
FROM pg_stat_database 
WHERE datname = 'cold_email_bot';
```

### Redis Health

```bash
redis-cli INFO stats
redis-cli INFO memory
redis-cli PING
```

## Getting Help

If you can't resolve the issue:

1. Collect logs:
```bash
docker-compose logs > logs.txt
```

2. Check configuration:
```bash
docker-compose config > config.txt
```

3. System information:
```bash
docker version > system-info.txt
docker-compose version >> system-info.txt
uname -a >> system-info.txt
```

4. Create GitHub issue with:
   - Error description
   - Steps to reproduce
   - Log files
   - Configuration (remove sensitive data)
   - System information

#!/bin/bash
set -e

# Database restore script for AI Cold Email Bot

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backups/postgres_backup_20250106_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[restore] Starting database restore from $BACKUP_FILE"
echo "[restore] WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "[restore] Restore cancelled"
    exit 0
fi

# Restore PostgreSQL
if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    echo "[restore] Restoring PostgreSQL database"
    
    # Stop services to prevent conflicts
    echo "[restore] Stopping services..."
    docker-compose stop core-api telegram-bot worker gmail-service ai-orchestrator
    
    # Restore database
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
    
    if [ $? -eq 0 ]; then
        echo "[restore] PostgreSQL restore completed successfully"
        
        # Restart services
        echo "[restore] Starting services..."
        docker-compose start core-api telegram-bot worker gmail-service ai-orchestrator
    else
        echo "[restore] PostgreSQL restore failed"
        exit 1
    fi
fi

# Restore Redis
if [[ "$BACKUP_FILE" == *.rdb.gz ]]; then
    echo "[restore] Restoring Redis database"
    
    docker-compose stop worker
    
    gunzip -c "$BACKUP_FILE" > /tmp/dump.rdb
    docker cp /tmp/dump.rdb $(docker-compose ps -q redis):/data/dump.rdb
    
    docker-compose start redis worker
    
    rm /tmp/dump.rdb
fi

echo "[restore] Restore completed at $(date +%Y%m%d_%H%M%S)"

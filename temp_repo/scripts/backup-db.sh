#!/bin/bash
set -e

# Database backup script for AI Cold Email Bot

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

echo "[backup] Starting database backup at $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
if [ -n "$DATABASE_URL" ]; then
    BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"
    echo "[backup] Backing up PostgreSQL to $BACKUP_FILE"
    
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "[backup] PostgreSQL backup completed successfully"
        
        # Upload to S3 if configured
        if [ -n "$AWS_S3_BUCKET" ]; then
            echo "[backup] Uploading to S3: $AWS_S3_BUCKET"
            aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/postgres/$(basename $BACKUP_FILE)"
        fi
    else
        echo "[backup] PostgreSQL backup failed"
        exit 1
    fi
fi

# Backup Redis (optional)
if [ -n "$REDIS_URL" ] && [ "$BACKUP_REDIS" = "true" ]; then
    REDIS_BACKUP_FILE="$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"
    echo "[backup] Backing up Redis to $REDIS_BACKUP_FILE"
    
    redis-cli --rdb "$REDIS_BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "[backup] Redis backup completed successfully"
        gzip "$REDIS_BACKUP_FILE"
        
        if [ -n "$AWS_S3_BUCKET" ]; then
            aws s3 cp "$REDIS_BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/backups/redis/$(basename $REDIS_BACKUP_FILE).gz"
        fi
    fi
fi

# Clean up old backups
echo "[backup] Cleaning up backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.rdb.gz" -mtime +$RETENTION_DAYS -delete

echo "[backup] Backup completed at $(date +%Y%m%d_%H%M%S)"

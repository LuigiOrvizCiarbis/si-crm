#!/bin/bash
# Backup PostgreSQL database from Docker container
# Keeps last 30 days of daily backups

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$(dirname "$SCRIPT_DIR")}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

# Read DB credentials from .env (POSIX-compatible)
DB_USER=$(sed -n 's/^DB_USERNAME=//p' "$COMPOSE_DIR/.env" 2>/dev/null || echo "laravel")
DB_NAME=$(sed -n 's/^DB_DATABASE=//p' "$COMPOSE_DIR/.env" 2>/dev/null || echo "laravel")
DB_USER="${DB_USER:-laravel}"
DB_NAME="${DB_NAME:-laravel}"

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T db \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file is empty" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: $BACKUP_FILE ($SIZE)"

find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Cleanup done. Current backups:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "No backups found"

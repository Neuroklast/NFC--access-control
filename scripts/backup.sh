#!/bin/sh
set -eu

RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/nfc-$STAMP.sql.gz"

docker compose exec -T db pg_dump -U nfc -d nfc | gzip > "$FILE"
echo "Backup: $FILE"

find "$BACKUP_DIR" -name 'nfc-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "Aufbewahrung: $RETENTION_DAYS Tage"

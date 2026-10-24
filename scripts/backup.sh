#!/usr/bin/env bash
# ==============================================================================
# Nightly Automated Database Backup Script
# - Dumps MySQL utf8mb4 with single-transaction
# - Compresses with gzip and computes SHA-256 checksum
# - Enforces 30-day retention policy
# - Optional sync to offsite Cloud S3/R2 storage
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_STORAGE_PATH:-/app/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/backup-aemade-selam-${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Starting automated database backup..."

# 1. Execute mysqldump
if [ -n "${CONTAINER_NAME:-}" ]; then
  # Executing from host targeting container
  docker exec "${CONTAINER_NAME}" mysqldump \
    --user="${MYSQL_USER}" \
    --password="${MYSQL_PASSWORD}" \
    --single-transaction \
    --quick \
    --default-character-set=utf8mb4 \
    --routines \
    --triggers \
    "${MYSQL_DATABASE}" | gzip -9 > "${BACKUP_FILE}"
else
  # Executing directly
  mysqldump \
    --host="${MYSQL_HOST:-mysql}" \
    --port="${MYSQL_PORT:-3306}" \
    --user="${MYSQL_USER}" \
    --password="${MYSQL_PASSWORD}" \
    --single-transaction \
    --quick \
    --default-character-set=utf8mb4 \
    --routines \
    --triggers \
    "${MYSQL_DATABASE}" | gzip -9 > "${BACKUP_FILE}"
fi

# 2. Generate SHA-256 checksum
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Backup created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# 3. Offsite sync to S3 / Cloudflare R2 if enabled
if [ "${S3_BACKUP_ENABLED:-false}" = "true" ]; then
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Uploading to offsite S3 storage: s3://${S3_BUCKET}/"
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/" \
    --endpoint-url="${S3_ENDPOINT}"
  aws s3 cp "${CHECKSUM_FILE}" "s3://${S3_BUCKET}/backups/" \
    --endpoint-url="${S3_ENDPOINT}"
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Offsite upload completed."
fi

# 4. Prune local backups older than RETENTION_DAYS (30 days)
echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "backup-aemade-selam-*.sql.gz*" -mtime +"${RETENTION_DAYS}" -print -delete

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Backup process completed successfully."

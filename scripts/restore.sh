#!/usr/bin/env bash
# ==============================================================================
# Database Restore Disaster Recovery Procedure
# Usage: ./restore.sh <path_to_backup.sql.gz>
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist!"
  exit 1
fi

echo "=== Aemade Selam Database Restore Procedure ==="
echo "Target File: ${BACKUP_FILE}"

# 1. Verify Checksum if present
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "Verifying SHA-256 integrity checksum..."
  sha256sum -c "${CHECKSUM_FILE}"
  echo "✓ Checksum verification passed."
fi

# 2. Confirm Database Target
echo "Database: ${MYSQL_DATABASE:-aemade_selam}"
echo "Host:     ${MYSQL_HOST:-mysql}"

# 3. Restore Dump
echo "Restoring database from compressed dump..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | mysql \
    --host="${MYSQL_HOST:-mysql}" \
    --port="${MYSQL_PORT:-3306}" \
    --user="${MYSQL_USER}" \
    --password="${MYSQL_PASSWORD}" \
    --default-character-set=utf8mb4 \
    "${MYSQL_DATABASE}"
else
  mysql \
    --host="${MYSQL_HOST:-mysql}" \
    --port="${MYSQL_PORT:-3306}" \
    --user="${MYSQL_USER}" \
    --password="${MYSQL_PASSWORD}" \
    --default-character-set=utf8mb4 \
    "${MYSQL_DATABASE}" < "${BACKUP_FILE}"
fi

echo "✓ Database dump restored successfully."

# 4. Verify Schema Migrations
echo "Verifying schema migrations..."
npx prisma migrate deploy

echo "=== Restore Completed Successfully ==="

#!/bin/sh
set -e

echo "=== Aemade Selam Production API Starting ==="

# Apply pending migrations without resetting the database
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy

  echo "Verifying core roles and super admin initialization..."
  npx ts-node scripts/first-run.ts
fi

echo "Launching application..."
exec "$@"

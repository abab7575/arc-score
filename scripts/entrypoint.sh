#!/bin/sh
set -e

DB_PATH="${DATABASE_PATH:-./data/arc-score.db}"
DB_DIR=$(dirname "$DB_PATH")

# Ensure data directory exists (Railway volume mount point)
mkdir -p "$DB_DIR"
mkdir -p "$DB_DIR/scan-logs"

# Only seed if database doesn't exist yet
if [ ! -f "$DB_PATH" ]; then
  echo "[entrypoint] No database found at $DB_PATH — seeding..."

  # Try copying pre-built seed database first (faster than re-seeding)
  if [ -d "./data.seed" ] && [ -f "./data.seed/arc-score.db" ]; then
    echo "[entrypoint] Copying seed database..."
    cp ./data.seed/arc-score.db "$DB_PATH"
  else
    echo "[entrypoint] Running seed scripts..."
    npx tsx src/lib/db/seed.ts
    npx tsx scripts/seed-feeds.ts
  fi

  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] Database exists at $DB_PATH ($(du -h "$DB_PATH" | cut -f1)) — skipping seed."
fi

# Always import brand CSVs (bulk-import skips duplicates, so this is safe)
# CSVs are in /app/brand-csvs because the data/ dir is a volume mount
echo "[entrypoint] Importing brand CSVs..."
if [ -d "/app/brand-csvs" ]; then
  for csv in /app/brand-csvs/*.csv; do
    echo "[entrypoint] Importing $csv..."
    npx tsx scripts/bulk-import.ts "$csv"
  done
  echo "[entrypoint] Brand import complete."
else
  echo "[entrypoint] No brand CSVs found at /app/brand-csvs — skipping."
fi

# Start the Next.js server
echo "[entrypoint] Starting server on port ${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}

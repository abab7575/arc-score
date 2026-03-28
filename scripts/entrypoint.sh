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
echo "[entrypoint] Importing brand CSVs..."
npx tsx scripts/bulk-import.ts data/seed-brands.csv 2>/dev/null || true
npx tsx scripts/bulk-import.ts data/brands-500.csv 2>/dev/null || true
echo "[entrypoint] Brand import complete."

# Start the Next.js server
echo "[entrypoint] Starting server on port ${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}

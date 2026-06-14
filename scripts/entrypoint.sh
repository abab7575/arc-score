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
    echo "[entrypoint] Running seed script..."
    npx tsx src/lib/db/seed.ts
  fi

  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] Database exists at $DB_PATH ($(du -h "$DB_PATH" | cut -f1)) — skipping seed."
fi

# Import brand CSVs only when their content changes. The prebuilt seed database
# already contains the bundled CSVs, and repeated imports make every deploy
# slower while flooding logs with duplicate notices.
if [ -d "/app/brand-csvs" ]; then
  IMPORT_MARKER="$DB_DIR/.brand-import-version"
  IMPORT_VERSION=$(sha256sum /app/brand-csvs/*.csv | sha256sum | cut -d " " -f1)
  PREVIOUS_IMPORT_VERSION=$(cat "$IMPORT_MARKER" 2>/dev/null || true)

  if [ -z "$PREVIOUS_IMPORT_VERSION" ]; then
    echo "$IMPORT_VERSION" > "$IMPORT_MARKER"
    echo "[entrypoint] Brand import marker initialized; bundled data is already present."
  elif [ "$IMPORT_VERSION" != "$PREVIOUS_IMPORT_VERSION" ]; then
    echo "[entrypoint] Brand CSV change detected; importing updates..."
    for csv in /app/brand-csvs/*.csv; do
      npx tsx scripts/bulk-import.ts "$csv"
    done
    echo "$IMPORT_VERSION" > "$IMPORT_MARKER"
    echo "[entrypoint] Brand import update complete."
  else
    echo "[entrypoint] Brand CSVs unchanged — skipping import."
  fi
else
  echo "[entrypoint] No brand CSVs found at /app/brand-csvs — skipping."
fi

# Start the Next.js server
echo "[entrypoint] Starting server on port ${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}

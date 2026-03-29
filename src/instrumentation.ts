/**
 * Next.js Instrumentation — runs once on server startup.
 * Starts the scan worker after a delay to ensure the database
 * and volume mounts are ready.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Delay worker start by 10 seconds to ensure:
    // - Database volume is mounted
    // - Auto-migrations in db/index.ts have run via normal request handling
    // - The Next.js server is healthy and responding to healthchecks
    setTimeout(async () => {
      try {
        // Ensure scan orchestration tables exist before starting worker
        const { db } = await import("@/lib/db");
        const { sql } = await import("drizzle-orm");

        db.run(sql`CREATE TABLE IF NOT EXISTS scan_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scan_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          total_brands INTEGER NOT NULL DEFAULT 0,
          completed_count INTEGER NOT NULL DEFAULT 0,
          failed_count INTEGER NOT NULL DEFAULT 0,
          skipped_count INTEGER NOT NULL DEFAULT 0,
          changes_detected INTEGER NOT NULL DEFAULT 0,
          drift_report TEXT,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        db.run(sql`CREATE TABLE IF NOT EXISTS scan_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id INTEGER NOT NULL REFERENCES scan_runs(id),
          brand_id INTEGER NOT NULL REFERENCES brands(id),
          status TEXT NOT NULL DEFAULT 'queued',
          error TEXT,
          retry_count INTEGER NOT NULL DEFAULT 0,
          scan_duration_ms INTEGER,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        db.run(sql`CREATE TABLE IF NOT EXISTS system_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        const { startScanWorker } = await import("@/lib/scanner/scan-worker");
        startScanWorker();
        console.log("[instrumentation] Scan worker started successfully");
      } catch (error) {
        console.error("[instrumentation] Scan worker failed to start:", error);
        // Non-fatal — the app continues serving requests without the worker
      }
    }, 10_000);

    console.log("[instrumentation] Scan worker will start in 10 seconds");
  }
}

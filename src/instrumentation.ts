/**
 * Next.js Instrumentation — runs once on server startup.
 *
 * SCAN WORKER DISABLED: The worker was crashing the app on Railway.
 * Scans will be triggered manually or via cron until this is resolved.
 * The enqueue + worker pattern works locally but needs investigation
 * for the production environment.
 */

export async function register() {
  // Worker disabled — see comment above
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[instrumentation] Scan worker is disabled in production. Use /api/cron/lightweight-scan to trigger scans.");
  }
}

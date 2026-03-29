/**
 * Next.js Instrumentation — runs once on server startup.
 * Used to start the scan worker.
 */

export async function register() {
  // Only run on the server, not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScanWorker } = await import("@/lib/scanner/scan-worker");
    startScanWorker();
    console.log("[instrumentation] Scan worker initialized");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runScanOnce } from "@/lib/scanner/run-scan";

// Fire-and-forget pattern: endpoint dispatches the scan in the background and
// returns immediately. This keeps us well under Railway's edge-proxy timeout.
// Scan progress is observable via /api/scan-health.

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const concurrencyParam = url.searchParams.get("concurrency");
  const concurrency = concurrencyParam ? parseInt(concurrencyParam, 10) : undefined;

  // Dispatch scan in background. Don't await.
  void runScanOnce({ concurrency }).catch((err) => {
    console.error("[cron/lightweight-scan] runScanOnce failed:", err instanceof Error ? err.message : err);
  });

  return NextResponse.json({
    status: "started",
    message: "Scan dispatched. Monitor /api/scan-health for progress.",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

import { NextRequest, NextResponse } from "next/server";
import { runScanOnce } from "@/lib/scanner/run-scan";

// This endpoint runs the full scan synchronously. Railway has no hard request
// timeout for long-running requests, but GitHub Actions caller should allow 20min.
export const maxDuration = 900; // 15 min Next.js hint

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

  try {
    const url = new URL(request.url);
    const concurrencyParam = url.searchParams.get("concurrency");
    const concurrency = concurrencyParam ? parseInt(concurrencyParam, 10) : undefined;

    const summary = await runScanOnce({ concurrency });

    return NextResponse.json({
      status: "completed",
      ...summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

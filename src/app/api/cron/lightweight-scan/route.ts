import { NextRequest, NextResponse } from "next/server";
import { enqueueLightweightScan } from "@/lib/scanner/scan-worker";

export async function POST(request: NextRequest) {
  // Mandatory CRON_SECRET auth
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
    const { runId, brandCount } = enqueueLightweightScan();
    return NextResponse.json({
      status: "enqueued",
      runId,
      brandCount,
      message: `Enqueued ${brandCount} brands for scanning. Worker will process them serially.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already in progress")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Also support GET for easier cron service integration
export async function GET(request: NextRequest) {
  return POST(request);
}

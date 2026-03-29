import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

/**
 * Cron: Scanner Validation
 * Runs the validation framework against recently scanned brands
 * to catch accuracy regressions. Should run weekly after full scans.
 *
 * POST /api/cron/validate?top=20
 */
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

  const top = request.nextUrl.searchParams.get("top") ?? "20";

  const cmd = `npx tsx scripts/validate-scanner.ts --top=${top}`;

  exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[cron/validate] Error:", error.message);
      console.error("[cron/validate] stderr:", stderr);
    } else {
      console.log("[cron/validate] Completed:", stdout.slice(-2000));
    }
  });

  return NextResponse.json({
    status: "started",
    message: `Validation triggered for top ${top} brands`,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

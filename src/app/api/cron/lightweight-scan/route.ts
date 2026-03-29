import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(request: NextRequest) {
  // Authenticate with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get("category");
  const concurrency = request.nextUrl.searchParams.get("concurrency") ?? "20";

  let cmd = `npx tsx scripts/daily-lightweight-scan.ts --concurrency=${concurrency}`;
  if (category) cmd += ` --category=${category}`;

  exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[cron/lightweight-scan] Error:", error.message);
      console.error("[cron/lightweight-scan] stderr:", stderr);
    } else {
      console.log("[cron/lightweight-scan] Completed:", stdout.slice(-500));
    }
  });

  return NextResponse.json({
    status: "started",
    message: "Lightweight scan triggered in background",
    config: { category, concurrency },
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

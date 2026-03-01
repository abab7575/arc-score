import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(request: NextRequest) {
  // Authenticate with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Spawn the daily scan script in the background
  const force = request.nextUrl.searchParams.get("force") === "true";
  const category = request.nextUrl.searchParams.get("category");

  let cmd = "npx tsx scripts/daily-scan.ts";
  if (force) cmd += " --force";
  if (category) cmd += ` --category=${category}`;

  exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[cron/daily-scan] Error:", error.message);
      console.error("[cron/daily-scan] stderr:", stderr);
    } else {
      console.log("[cron/daily-scan] Completed:", stdout.slice(-500));
    }
  });

  return NextResponse.json({
    status: "started",
    message: "Daily scan triggered in background",
    config: { force, category },
    timestamp: new Date().toISOString(),
  });
}

// Also support GET for simple cron services
export async function GET(request: NextRequest) {
  return POST(request);
}

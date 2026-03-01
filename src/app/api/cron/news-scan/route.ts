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

  const force = request.nextUrl.searchParams.get("force") === "true";

  let cmd = "npx tsx scripts/news-scan.ts";
  if (force) cmd += " --force";

  exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[cron/news-scan] Error:", error.message);
      console.error("[cron/news-scan] stderr:", stderr);
    } else {
      console.log("[cron/news-scan] Completed:", stdout.slice(-500));
    }
  });

  return NextResponse.json({
    status: "started",
    message: "News scan triggered in background",
    config: { force },
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

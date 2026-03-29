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

  // Spawn the brand discovery script in the background
  exec("npx tsx scripts/brand-discovery.ts", { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[cron/brand-discovery] Error:", error.message);
      console.error("[cron/brand-discovery] stderr:", stderr);
    } else {
      console.log("[cron/brand-discovery] Completed:", stdout.slice(-500));
    }
  });

  return NextResponse.json({
    status: "started",
    message: "Brand discovery triggered in background",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

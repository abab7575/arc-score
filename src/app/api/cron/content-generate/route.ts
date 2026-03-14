import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export const dynamic = "force-dynamic";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured = allow (dev mode)
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runGeneration();
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runGeneration();
}

function runGeneration(): NextResponse {
  // Fire and forget — returns immediately
  exec("npx tsx scripts/content-generate.ts", { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("[content-generate] Error:", error.message);
      console.error("[content-generate] stderr:", stderr);
    }
    if (stdout) {
      console.log("[content-generate]", stdout);
    }
  });

  return NextResponse.json({
    status: "started",
    message: "Content generation started in background",
    timestamp: new Date().toISOString(),
  });
}

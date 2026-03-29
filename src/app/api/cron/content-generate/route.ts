import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export const dynamic = "force-dynamic";

function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return runGeneration();
}

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

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

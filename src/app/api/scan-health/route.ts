import { NextRequest, NextResponse } from "next/server";
import { getScanHealth } from "@/lib/scanner/scan-worker";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 30, 60000);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  try {
    const health = getScanHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error("Scan health error:", error);
    return NextResponse.json(
      { error: "Failed to get scan health", overallStatus: "red" },
      { status: 500 }
    );
  }
}

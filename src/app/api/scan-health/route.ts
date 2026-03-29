import { NextResponse } from "next/server";
import { getScanHealth } from "@/lib/scanner/scan-worker";

export async function GET() {
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

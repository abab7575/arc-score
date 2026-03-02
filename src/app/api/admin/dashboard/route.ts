import { NextResponse } from "next/server";
import { getScanHealth, getDailyBrief } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = getScanHealth();
    let dailyBrief = null;
    try {
      dailyBrief = getDailyBrief();
    } catch {
      // dailyBrief may fail if brand_discoveries table doesn't exist yet
    }
    return NextResponse.json({ ...health, dailyBrief });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

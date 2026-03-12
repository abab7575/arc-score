import { NextResponse } from "next/server";
import { getScanHealth, getDailyBrief } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

const EMPTY_HEALTH: {
  lastScanAt: string | null;
  totalBrands: number;
  avgScore: number;
  todayScans: number;
  recentScans: { id: number; brandName: string; brandSlug: string; overallScore: number; grade: string; scannedAt: string }[];
} = {
  lastScanAt: null,
  totalBrands: 0,
  avgScore: 0,
  todayScans: 0,
  recentScans: [],
};

export async function GET() {
  let health: typeof EMPTY_HEALTH = EMPTY_HEALTH;
  let dailyBrief = null;

  try {
    health = getScanHealth();
  } catch (error) {
    console.error("getScanHealth error:", error);
  }

  try {
    dailyBrief = getDailyBrief();
  } catch (error) {
    console.error("getDailyBrief error:", error);
  }

  return NextResponse.json({ ...health, dailyBrief });
}

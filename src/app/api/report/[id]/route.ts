import { NextResponse } from "next/server";
import { getReport } from "@/lib/mock-data";
import { getFullScanReport } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try DB first (scan IDs are numeric)
  const scanId = parseInt(id);
  if (!isNaN(scanId)) {
    const dbReport = getFullScanReport(scanId);
    if (dbReport) return NextResponse.json(dbReport);
  }

  // Fallback to mock data
  const report = getReport(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

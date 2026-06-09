import { NextResponse } from "next/server";
import {
  buildSnapshot,
  snapshotToCsv,
  hasDataForDate,
  getEarliestSnapshotDate,
} from "@/lib/data-export";

export const revalidate = 86400; // archived days are immutable

const FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})\.(json|csv)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const match = FILE_PATTERN.exec(file);
  if (!match) {
    return NextResponse.json(
      { error: "Expected /data/YYYY-MM-DD.json or /data/YYYY-MM-DD.csv (or /data/latest.json)." },
      { status: 400 },
    );
  }
  const [, date, format] = match;

  if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: `Invalid date: ${date}` }, { status: 400 });
  }
  if (date > new Date().toISOString().split("T")[0]) {
    return NextResponse.json({ error: `No snapshot for future date ${date}.` }, { status: 404 });
  }
  if (!hasDataForDate(date)) {
    const earliest = getEarliestSnapshotDate();
    return NextResponse.json(
      { error: `No data on or before ${date}.${earliest ? ` Earliest snapshot: ${earliest}.` : ""}` },
      { status: 404 },
    );
  }

  const snapshot = buildSnapshot(date);
  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=86400",
    "Access-Control-Allow-Origin": "*",
    "Content-Disposition": `inline; filename="arc-report-${date}.${format}"`,
  };
  if (format === "csv") {
    return new Response(snapshotToCsv(snapshot), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  }
  return NextResponse.json(snapshot, { headers });
}

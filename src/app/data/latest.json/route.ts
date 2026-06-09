import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/data-export";

export const revalidate = 3600;

export async function GET() {
  const snapshot = buildSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": 'inline; filename="arc-report-latest.json"',
    },
  });
}

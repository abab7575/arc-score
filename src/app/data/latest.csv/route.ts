import { buildSnapshot, snapshotToCsv } from "@/lib/data-export";

export const revalidate = 3600;

export async function GET() {
  const csv = snapshotToCsv(buildSnapshot());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": 'inline; filename="arc-report-latest.csv"',
    },
  });
}

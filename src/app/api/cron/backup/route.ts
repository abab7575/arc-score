import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { DB_PATH, sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  sqlite.pragma("wal_checkpoint(FULL)");
  const data = await readFile(DB_PATH);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="arc-report-${new Date().toISOString().slice(0, 10)}.db"`,
      "Cache-Control": "no-store",
    },
  });
}

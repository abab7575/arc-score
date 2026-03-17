import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const filePath = join(process.cwd(), "data", "robots-matrix.json");

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: "Matrix data not found. Run: npx tsx scripts/scan-robots-matrix.ts" },
      { status: 404 }
    );
  }

  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return NextResponse.json(data);
}

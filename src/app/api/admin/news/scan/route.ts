import { NextResponse } from "next/server";
import { runNewsScan } from "@/lib/news/scan";

export async function POST() {
  try {
    const result = await runNewsScan();
    return NextResponse.json(result);
  } catch (error) {
    console.error("News scan error:", error);
    return NextResponse.json(
      { error: "Scan failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}

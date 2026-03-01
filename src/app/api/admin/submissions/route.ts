import { NextResponse } from "next/server";
import { getPendingSubmissions } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const submissions = getPendingSubmissions();
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

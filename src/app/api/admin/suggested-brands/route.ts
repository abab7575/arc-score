import { NextResponse } from "next/server";
import { getSuggestedBrands } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suggestions = getSuggestedBrands();
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggested brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

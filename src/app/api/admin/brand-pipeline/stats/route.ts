import { NextResponse } from "next/server";
import { getDiscoveryStats } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getDiscoveryStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Brand pipeline stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

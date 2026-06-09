import { NextRequest, NextResponse } from "next/server";
import { buildMatrixPayload } from "@/lib/index-data";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 30, 60000);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  return NextResponse.json(buildMatrixPayload());
}

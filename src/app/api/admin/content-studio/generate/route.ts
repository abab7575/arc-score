import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/content-studio/generators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentType,
      platform,
      categoryId,
      brandSlug,
      agentId,
      direction,
      count,
      articleIds,
      commentary,
    } = body;

    if (!contentType || !platform) {
      return NextResponse.json(
        { error: "contentType and platform are required" },
        { status: 400 }
      );
    }

    const result = generateContent({
      contentType,
      platform,
      categoryId,
      brandSlug,
      agentId,
      direction,
      count,
      articleIds,
      commentary,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Content studio generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

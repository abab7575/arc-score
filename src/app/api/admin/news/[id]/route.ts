import { NextRequest, NextResponse } from "next/server";
import { markArticleRead, toggleArticleFlag } from "@/lib/db/admin-queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const articleId = parseInt(id);

    if (typeof body.read === "boolean") {
      markArticleRead(articleId, body.read);
    }
    if (typeof body.flagged === "boolean") {
      toggleArticleFlag(articleId, body.flagged);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

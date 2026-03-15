import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const item = db
    .select({ imageData: schema.contentQueue.imageData })
    .from(schema.contentQueue)
    .where(eq(schema.contentQueue.id, itemId))
    .get();

  if (!item?.imageData) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const buffer = Buffer.from(item.imageData, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

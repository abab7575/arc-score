import { NextRequest, NextResponse } from "next/server";
import { removeFeedSource } from "@/lib/db/admin-queries";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const sourceId = parseInt(id);

    const allowedFields: Record<string, unknown> = {};
    if (updates.name !== undefined) allowedFields.name = updates.name;
    if (updates.category !== undefined) allowedFields.category = updates.category;
    if (updates.active !== undefined) allowedFields.active = updates.active;
    if (updates.sourceType !== undefined) allowedFields.sourceType = updates.sourceType;

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    db.update(schema.feedSources)
      .set(allowedFields)
      .where(eq(schema.feedSources.id, sourceId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update source error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    removeFeedSource(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete source error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

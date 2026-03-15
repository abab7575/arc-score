import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/outreach/[id] — Update outreach item
 * Body: { status?, contactEmail?, contactName?, contactTitle?, emailSource?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.contactEmail !== undefined) updates.contactEmail = body.contactEmail;
    if (body.contactName !== undefined) updates.contactName = body.contactName;
    if (body.contactTitle !== undefined) updates.contactTitle = body.contactTitle;
    if (body.emailSource !== undefined) updates.emailSource = body.emailSource;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (body.status === "sent") updates.sentAt = new Date().toISOString();
    if (body.status === "replied") updates.repliedAt = new Date().toISOString();

    // Auto-set status to ready when email is added
    if (body.contactEmail && !body.status) {
      updates.status = "ready";
    }

    db.update(schema.outreach)
      .set(updates)
      .where(eq(schema.outreach.id, parseInt(id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating outreach:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/outreach/[id] — Remove outreach item
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.delete(schema.outreach)
      .where(eq(schema.outreach.id, parseInt(id)))
      .run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting outreach:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { updateContentQueueStatus, deleteContentQueueItem } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["draft", "approved", "posted", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: draft, approved, posted, archived" },
        { status: 400 }
      );
    }

    updateContentQueueStatus(parseInt(id), status);
    return NextResponse.json({ success: true, id: parseInt(id), status });
  } catch (error) {
    console.error("Error updating content queue item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteContentQueueItem(parseInt(id));
    return NextResponse.json({ success: true, id: parseInt(id) });
  } catch (error) {
    console.error("Error deleting content queue item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

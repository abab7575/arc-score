import { NextRequest, NextResponse } from "next/server";
import { removeBrand, toggleBrandActive } from "@/lib/db/admin-queries";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    removeBrand(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { active } = await request.json();

    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "active (boolean) is required" }, { status: 400 });
    }

    toggleBrandActive(parseInt(id), active);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

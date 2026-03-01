import { NextRequest, NextResponse } from "next/server";
import { updateSubmissionStatus, addBrand } from "@/lib/db/admin-queries";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const submissionId = parseInt(id);
    updateSubmissionStatus(submissionId, status);

    // If approved, create the brand
    if (status === "approved") {
      const submission = db
        .select()
        .from(schema.submissions)
        .where(eq(schema.submissions.id, submissionId))
        .get();

      if (submission) {
        addBrand({
          name: submission.brandName,
          url: submission.url,
          category: submission.category ?? "general",
          productUrl: submission.productUrl ?? undefined,
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

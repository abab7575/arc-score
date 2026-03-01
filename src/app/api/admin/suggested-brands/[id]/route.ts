import { NextRequest, NextResponse } from "next/server";
import { updateSuggestedBrandStatus, addBrand } from "@/lib/db/admin-queries";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, name, url, category } = await request.json();

    if (!["added", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'added' or 'dismissed'" },
        { status: 400 }
      );
    }

    const suggestionId = parseInt(id);
    updateSuggestedBrandStatus(suggestionId, status);

    // If adding, create brand
    if (status === "added") {
      const suggestion = db
        .select()
        .from(schema.suggestedBrands)
        .where(eq(schema.suggestedBrands.id, suggestionId))
        .get();

      if (suggestion) {
        const brandName = name || suggestion.name;
        addBrand({
          name: brandName,
          url: url || suggestion.url || `https://${brandName.toLowerCase().replace(/\s+/g, "")}.com`,
          category: category || "general",
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Update suggested brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

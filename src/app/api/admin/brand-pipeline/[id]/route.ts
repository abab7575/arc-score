import { NextRequest, NextResponse } from "next/server";
import { updateDiscoveryStatus, addBrand } from "@/lib/db/admin-queries";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, name, url, category, notes } = await request.json();

    if (!["tracking", "skipped", "review_later", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'tracking', 'skipped', 'review_later', or 'pending'" },
        { status: 400 }
      );
    }

    const discoveryId = parseInt(id);
    updateDiscoveryStatus(discoveryId, status, notes);

    // If tracking, create brand from discovery data
    if (status === "tracking") {
      const discovery = db
        .select()
        .from(schema.brandDiscoveries)
        .where(eq(schema.brandDiscoveries.id, discoveryId))
        .get();

      if (discovery) {
        const brandName = name || discovery.name;
        const brandUrl = url || discovery.url || `https://${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
        const brandCategory = category || discovery.category || "general";

        addBrand({
          name: brandName,
          url: brandUrl,
          category: brandCategory,
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Update discovery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

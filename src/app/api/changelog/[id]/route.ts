import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const entry = db
    .select()
    .from(schema.changelogEntries)
    .where(eq(schema.changelogEntries.id, entryId))
    .get();

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const brand = db
    .select({ slug: schema.brands.slug, name: schema.brands.name, url: schema.brands.url })
    .from(schema.brands)
    .where(eq(schema.brands.id, entry.brandId))
    .get();

  return NextResponse.json({
    ...entry,
    brandSlug: brand?.slug ?? "unknown",
    brandName: brand?.name ?? "Unknown",
    brandUrl: brand?.url ?? null,
  });
}

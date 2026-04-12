import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { sql, gte, desc } from "drizzle-orm";

export async function GET() {
  const brandCountRow = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brands)
    .get();
  const brandCount = brandCountRow?.count ?? 0;

  const lastScanRow = db
    .select({ scannedAt: schema.lightweightScans.scannedAt })
    .from(schema.lightweightScans)
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .limit(1)
    .get();
  const lastScan = lastScanRow?.scannedAt ?? null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const changesRow = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, sevenDaysAgo))
    .get();
  const changesThisWeek = changesRow?.count ?? 0;

  const agentsTracked = 9;

  const recent = db
    .select({
      id: schema.changelogEntries.id,
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
    })
    .from(schema.changelogEntries)
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(10)
    .all();

  const brandIds = [...new Set(recent.map(r => r.brandId))];
  const brands = db
    .select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name })
    .from(schema.brands)
    .all();
  const brandMap = new Map(brands.map(b => [b.id, b]));

  const recentChanges = recent
    .filter(r => brandIds.includes(r.brandId))
    .map(r => ({
      ...r,
      brandSlug: brandMap.get(r.brandId)?.slug ?? "unknown",
      brandName: brandMap.get(r.brandId)?.name ?? "Unknown",
    }));

  return NextResponse.json({
    brandCount,
    lastScan,
    changesThisWeek,
    agentsTracked,
    recentChanges,
  });
}

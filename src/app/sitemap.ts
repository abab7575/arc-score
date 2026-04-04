import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

const BASE_URL = process.env.BASE_URL || "https://arcreport.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/matrix`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/changelog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/landscape`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  ];

  // Dynamic brand pages — query all active brands with their latest scan date
  const brands = db
    .select({
      slug: schema.brands.slug,
      id: schema.brands.id,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => {
    // Get the latest scan date for this brand
    const latestScan = db
      .select({ scannedAt: schema.scans.scannedAt })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1)
      .get();

    return {
      url: `${BASE_URL}/brand/${brand.slug}`,
      lastModified: latestScan?.scannedAt ? new Date(latestScan.scannedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    };
  });

  return [...staticPages, ...brandPages];
}

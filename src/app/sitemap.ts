import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/matrix`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/changelog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/insights`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/weekly`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/data`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/scan`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/mcp`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/reliability`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/landscape`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/pro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  // Dynamic brand pages — single query for latest scan date per brand
  const brands = db
    .select({ slug: schema.brands.slug, id: schema.brands.id })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  const latestScans = new Map<number, string>();
  for (const row of db
    .select({ brandId: schema.lightweightScans.brandId, scannedAt: schema.lightweightScans.scannedAt })
    .from(schema.lightweightScans)
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .all()) {
    if (!latestScans.has(row.brandId)) latestScans.set(row.brandId, row.scannedAt);
  }

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE_URL}/brand/${brand.slug}`,
    lastModified: latestScans.has(brand.id) ? new Date(latestScans.get(brand.id)!) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...brandPages];
}

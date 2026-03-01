import { db, schema } from "./index";
import { eq, desc, sql, and, like, gte, lte, or } from "drizzle-orm";

// ── Dashboard ───────────────────────────────────────────────────────

export function getScanHealth() {
  const lastScan = db
    .select({
      scannedAt: schema.scans.scannedAt,
      overallScore: schema.scans.overallScore,
      grade: schema.scans.grade,
    })
    .from(schema.scans)
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1)
    .get();

  const totalBrands = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .get()!.count;

  const avgScore = db
    .select({ avg: sql<number>`round(avg(s.overall_score))` })
    .from(
      db
        .select({
          brandId: schema.scans.brandId,
          overallScore: schema.scans.overallScore,
          rn: sql<number>`row_number() over (partition by brand_id order by scanned_at desc)`.as("rn"),
        })
        .from(schema.scans)
        .as("s")
    )
    .where(sql`s.rn = 1`)
    .get()?.avg ?? 0;

  // Get today's scan stats
  const today = new Date().toISOString().split("T")[0];
  const todayScans = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.scans)
    .where(gte(schema.scans.scannedAt, today))
    .get()!.count;

  const recentScans = db
    .select({
      id: schema.scans.id,
      brandId: schema.scans.brandId,
      overallScore: schema.scans.overallScore,
      grade: schema.scans.grade,
      scannedAt: schema.scans.scannedAt,
    })
    .from(schema.scans)
    .orderBy(desc(schema.scans.scannedAt))
    .limit(20)
    .all();

  // Attach brand names
  const recentWithNames = recentScans.map((scan) => {
    const brand = db
      .select({ name: schema.brands.name, slug: schema.brands.slug })
      .from(schema.brands)
      .where(eq(schema.brands.id, scan.brandId))
      .get();
    return { ...scan, brandName: brand?.name ?? "Unknown", brandSlug: brand?.slug ?? "" };
  });

  return {
    lastScanAt: lastScan?.scannedAt ?? null,
    totalBrands,
    avgScore,
    todayScans,
    recentScans: recentWithNames,
  };
}

// ── Brands ──────────────────────────────────────────────────────────

export function getAllBrandsAdmin() {
  const brands = db.select().from(schema.brands).orderBy(schema.brands.name).all();

  return brands.map((brand) => {
    const latestScan = db
      .select({
        overallScore: schema.scans.overallScore,
        grade: schema.scans.grade,
        scannedAt: schema.scans.scannedAt,
      })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1)
      .get();

    return {
      ...brand,
      latestScore: latestScan?.overallScore ?? null,
      latestGrade: latestScan?.grade ?? null,
      lastScannedAt: latestScan?.scannedAt ?? null,
    };
  });
}

export function addBrand(data: {
  name: string;
  url: string;
  category: string;
  productUrl?: string;
}) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return db
    .insert(schema.brands)
    .values({
      slug,
      name: data.name,
      url: data.url,
      productUrl: data.productUrl,
      category: data.category,
    })
    .returning()
    .get();
}

export function removeBrand(id: number) {
  return db
    .update(schema.brands)
    .set({ active: false })
    .where(eq(schema.brands.id, id))
    .run();
}

export function toggleBrandActive(id: number, active: boolean) {
  return db
    .update(schema.brands)
    .set({ active })
    .where(eq(schema.brands.id, id))
    .run();
}

// ── Submissions ─────────────────────────────────────────────────────

export function getPendingSubmissions() {
  return db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.status, "pending"))
    .orderBy(desc(schema.submissions.createdAt))
    .all();
}

export function updateSubmissionStatus(id: number, status: string) {
  return db
    .update(schema.submissions)
    .set({ status })
    .where(eq(schema.submissions.id, id))
    .run();
}

// ── News Articles ───────────────────────────────────────────────────

export function getNewsArticles(filters?: {
  unreadOnly?: boolean;
  flaggedOnly?: boolean;
  minRelevance?: number;
  search?: string;
  sourceId?: number;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (filters?.unreadOnly) {
    conditions.push(eq(schema.newsArticles.read, false));
  }
  if (filters?.flaggedOnly) {
    conditions.push(eq(schema.newsArticles.flagged, true));
  }
  if (filters?.minRelevance) {
    conditions.push(gte(schema.newsArticles.relevanceScore, filters.minRelevance));
  }
  if (filters?.sourceId) {
    conditions.push(eq(schema.newsArticles.feedSourceId, filters.sourceId));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(schema.newsArticles.title, `%${filters.search}%`),
        like(schema.newsArticles.description, `%${filters.search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const articles = db
    .select()
    .from(schema.newsArticles)
    .where(where)
    .orderBy(desc(schema.newsArticles.publishedAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0)
    .all();

  // Attach source names
  return articles.map((article) => {
    let sourceName = "Unknown";
    if (article.feedSourceId) {
      const source = db
        .select({ name: schema.feedSources.name })
        .from(schema.feedSources)
        .where(eq(schema.feedSources.id, article.feedSourceId))
        .get();
      sourceName = source?.name ?? "Unknown";
    }
    return { ...article, sourceName };
  });
}

export function markArticleRead(id: number, read: boolean) {
  return db
    .update(schema.newsArticles)
    .set({ read })
    .where(eq(schema.newsArticles.id, id))
    .run();
}

export function toggleArticleFlag(id: number, flagged: boolean) {
  return db
    .update(schema.newsArticles)
    .set({ flagged })
    .where(eq(schema.newsArticles.id, id))
    .run();
}

// ── Suggested Brands ────────────────────────────────────────────────

export function getSuggestedBrands() {
  return db
    .select()
    .from(schema.suggestedBrands)
    .where(eq(schema.suggestedBrands.status, "pending"))
    .orderBy(desc(schema.suggestedBrands.mentionCount))
    .all();
}

export function updateSuggestedBrandStatus(id: number, status: string) {
  return db
    .update(schema.suggestedBrands)
    .set({ status })
    .where(eq(schema.suggestedBrands.id, id))
    .run();
}

// ── Feed Sources ────────────────────────────────────────────────────

export function getFeedSources() {
  return db.select().from(schema.feedSources).orderBy(schema.feedSources.name).all();
}

export function addFeedSource(data: { name: string; url: string; category: string }) {
  return db
    .insert(schema.feedSources)
    .values(data)
    .returning()
    .get();
}

export function removeFeedSource(id: number) {
  return db
    .delete(schema.feedSources)
    .where(eq(schema.feedSources.id, id))
    .run();
}

export function updateFeedSourceLastFetched(id: number) {
  return db
    .update(schema.feedSources)
    .set({ lastFetchedAt: new Date().toISOString() })
    .where(eq(schema.feedSources.id, id))
    .run();
}

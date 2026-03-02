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

export function addFeedSource(data: { name: string; url: string; category: string; sourceType?: string }) {
  return db
    .insert(schema.feedSources)
    .values({
      name: data.name,
      url: data.url,
      category: data.category,
      sourceType: data.sourceType || "rss",
    })
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

// ── Brand Discovery Pipeline ───────────────────────────────────────

export function getDiscoveries(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(schema.brandDiscoveries.status, filters.status));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(schema.brandDiscoveries.name, `%${filters.search}%`),
        like(schema.brandDiscoveries.reason, `%${filters.search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const discoveries = db
    .select()
    .from(schema.brandDiscoveries)
    .where(where)
    .orderBy(desc(schema.brandDiscoveries.mentionCount), desc(schema.brandDiscoveries.createdAt))
    .limit(filters?.limit ?? 100)
    .offset(filters?.offset ?? 0)
    .all();

  // Attach source article title if available
  return discoveries.map((d) => {
    let sourceArticleTitle: string | null = null;
    if (d.sourceArticleId) {
      const article = db
        .select({ title: schema.newsArticles.title })
        .from(schema.newsArticles)
        .where(eq(schema.newsArticles.id, d.sourceArticleId))
        .get();
      sourceArticleTitle = article?.title ?? null;
    }
    return { ...d, sourceArticleTitle };
  });
}

export function updateDiscoveryStatus(
  id: number,
  status: string,
  notes?: string
) {
  const updates: Record<string, unknown> = { status };
  if (status === "tracking" || status === "skipped") {
    updates.reviewedAt = new Date().toISOString();
  }
  if (notes !== undefined) {
    updates.notes = notes;
  }
  return db
    .update(schema.brandDiscoveries)
    .set(updates)
    .where(eq(schema.brandDiscoveries.id, id))
    .run();
}

export function getDiscoveryStats() {
  const total = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .get()!.count;

  const pending = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(eq(schema.brandDiscoveries.status, "pending"))
    .get()!.count;

  // Total brands being tracked (all active brands, not just pipeline-approved ones)
  const tracking = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .get()!.count;

  const skipped = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(eq(schema.brandDiscoveries.status, "skipped"))
    .get()!.count;

  const reviewLater = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(eq(schema.brandDiscoveries.status, "review_later"))
    .get()!.count;

  // Added this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const addedThisWeek = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(
      and(
        eq(schema.brandDiscoveries.status, "tracking"),
        gte(schema.brandDiscoveries.reviewedAt, weekAgo)
      )
    )
    .get()!.count;

  // Categories covered
  const categories = db
    .select({ category: schema.brandDiscoveries.category })
    .from(schema.brandDiscoveries)
    .where(eq(schema.brandDiscoveries.status, "pending"))
    .all();
  const uniqueCategories = new Set(categories.map((c) => c.category).filter(Boolean));

  return {
    total,
    pending,
    tracking,
    skipped,
    reviewLater,
    addedThisWeek,
    categoriesCovered: uniqueCategories.size,
  };
}

export function insertDiscovery(data: {
  name: string;
  url?: string;
  category?: string;
  discoverySource: string;
  sourceArticleId?: number;
  reason?: string;
}) {
  return db
    .insert(schema.brandDiscoveries)
    .values(data)
    .returning()
    .get();
}

export function incrementDiscoveryMentionCount(id: number) {
  return db
    .update(schema.brandDiscoveries)
    .set({
      mentionCount: sql`${schema.brandDiscoveries.mentionCount} + 1`,
    })
    .where(eq(schema.brandDiscoveries.id, id))
    .run();
}

export function getExistingDiscoveryByName(name: string) {
  return db
    .select()
    .from(schema.brandDiscoveries)
    .where(
      and(
        sql`lower(${schema.brandDiscoveries.name}) = ${name.toLowerCase()}`,
        or(
          eq(schema.brandDiscoveries.status, "pending"),
          eq(schema.brandDiscoveries.status, "review_later")
        )!
      )
    )
    .get();
}

// ── Daily Brief ────────────────────────────────────────────────────

export function getDailyBrief() {
  const today = new Date().toISOString().split("T")[0];

  // Content items today
  const todayContent = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.newsArticles)
    .where(gte(schema.newsArticles.createdAt, today))
    .get()!.count;

  // High relevance items needing attention
  const highRelevance = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.newsArticles)
    .where(
      and(
        gte(schema.newsArticles.relevanceScore, 70),
        eq(schema.newsArticles.read, false)
      )
    )
    .get()!.count;

  // Brand discoveries today
  const discoveriesToday = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(gte(schema.brandDiscoveries.createdAt, today))
    .get()!.count;

  // Brands in review queue
  const inReviewQueue = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandDiscoveries)
    .where(
      or(
        eq(schema.brandDiscoveries.status, "pending"),
        eq(schema.brandDiscoveries.status, "review_later")
      )!
    )
    .get()!.count;

  // Feed health — sources fetched today
  const feedsFetchedToday = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.feedSources)
    .where(
      and(
        eq(schema.feedSources.active, true),
        gte(schema.feedSources.lastFetchedAt, today)
      )
    )
    .get()!.count;

  const totalActiveFeeds = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.feedSources)
    .where(eq(schema.feedSources.active, true))
    .get()!.count;

  return {
    todayContent,
    highRelevance,
    discoveriesToday,
    inReviewQueue,
    feedsFetchedToday,
    totalActiveFeeds,
  };
}

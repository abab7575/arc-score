import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  productUrl: text("product_url"),
  category: text("category").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const scans = sqliteTable("scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  overallScore: integer("overall_score").notNull(),
  grade: text("grade").notNull(),
  verdict: text("verdict").notNull(),
  comparison: text("comparison").notNull(),
  reportJson: text("report_json").notNull(), // Full ScanReport as JSON
  scannedAt: text("scanned_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const categoryScores = sqliteTable("category_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: integer("scan_id").notNull().references(() => scans.id),
  categoryId: text("category_id").notNull(),
  score: integer("score").notNull(),
  grade: text("grade").notNull(),
  summary: text("summary").notNull(),
});

export const findings = sqliteTable("findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: integer("scan_id").notNull().references(() => scans.id),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  whatHappened: text("what_happened").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  fixJson: text("fix_json").notNull(),
  priority: integer("priority").notNull(),
  effort: text("effort").notNull(),
  estimatedPointsGain: integer("estimated_points_gain").notNull(),
});

export const journeySteps = sqliteTable("journey_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: integer("scan_id").notNull().references(() => scans.id),
  agentType: text("agent_type").notNull(),
  stepNumber: integer("step_number").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  result: text("result").notNull(),
  narration: text("narration").notNull(),
  screenshotUrl: text("screenshot_url"),
  thought: text("thought"),
  duration: integer("duration"),
});

export const agentSummaries = sqliteTable("agent_summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: integer("scan_id").notNull().references(() => scans.id),
  agentType: text("agent_type").notNull(),
  overallResult: text("overall_result").notNull(),
  narrative: text("narrative").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandName: text("brand_name").notNull(),
  url: text("url").notNull(),
  productUrl: text("product_url"),
  category: text("category"),
  email: text("email"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Admin: News Monitoring ──────────────────────────────────────────

export const feedSources = sqliteTable("feed_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  category: text("category").notNull(), // e.g. "ai-lab", "ecommerce", "tech-news"
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastFetchedAt: text("last_fetched_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feedSourceId: integer("feed_source_id").references(() => feedSources.id),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  publishedAt: text("published_at"),
  relevanceScore: integer("relevance_score").notNull().default(0), // 0-100
  relevanceTags: text("relevance_tags").notNull().default("[]"), // JSON array
  mentionedBrands: text("mentioned_brands").notNull().default("[]"), // JSON array
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const suggestedBrands = sqliteTable("suggested_brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url"),
  sourceArticleId: integer("source_article_id").references(() => newsArticles.id),
  mentionCount: integer("mention_count").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending, added, dismissed
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/**
 * Seed script — creates tables and populates brands.
 * Usage: npx tsx src/lib/db/seed.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { BRANDS } from "../brands";
import { FEED_SOURCES } from "../news/feed-sources";

const DB_PATH = path.join(process.cwd(), "data", "arc-score.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("Creating tables...");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    product_url TEXT,
    category TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    overall_score INTEGER NOT NULL,
    grade TEXT NOT NULL,
    verdict TEXT NOT NULL,
    comparison TEXT NOT NULL,
    report_json TEXT NOT NULL,
    scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS category_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL REFERENCES scans(id),
    category_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    grade TEXT NOT NULL,
    summary TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL REFERENCES scans(id),
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    what_happened TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    fix_json TEXT NOT NULL,
    priority INTEGER NOT NULL,
    effort TEXT NOT NULL,
    estimated_points_gain INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS journey_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL REFERENCES scans(id),
    agent_type TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    result TEXT NOT NULL,
    narration TEXT NOT NULL,
    screenshot_url TEXT,
    thought TEXT,
    duration INTEGER
  );

  CREATE TABLE IF NOT EXISTS agent_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL REFERENCES scans(id),
    agent_type TEXT NOT NULL,
    overall_result TEXT NOT NULL,
    narrative TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT NOT NULL,
    url TEXT NOT NULL,
    product_url TEXT,
    category TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feed_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    last_fetched_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_source_id INTEGER REFERENCES feed_sources(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    published_at TEXT,
    relevance_score INTEGER NOT NULL DEFAULT 0,
    relevance_tags TEXT NOT NULL DEFAULT '[]',
    mentioned_brands TEXT NOT NULL DEFAULT '[]',
    read INTEGER NOT NULL DEFAULT 0,
    flagged INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suggested_brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT,
    source_article_id INTEGER REFERENCES news_articles(id),
    mention_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_scans_brand_id ON scans(brand_id);
  CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
  CREATE INDEX IF NOT EXISTS idx_category_scores_scan_id ON category_scores(scan_id);
  CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id);
  CREATE INDEX IF NOT EXISTS idx_journey_steps_scan_id ON journey_steps(scan_id);
  CREATE INDEX IF NOT EXISTS idx_agent_summaries_scan_id ON agent_summaries(scan_id);
  CREATE INDEX IF NOT EXISTS idx_news_articles_relevance ON news_articles(relevance_score);
  CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at);
  CREATE INDEX IF NOT EXISTS idx_suggested_brands_status ON suggested_brands(status);
`);

console.log("Tables created.");

// Seed brands
const insertBrand = sqlite.prepare(`
  INSERT OR IGNORE INTO brands (slug, name, url, product_url, category)
  VALUES (?, ?, ?, ?, ?)
`);

const insertMany = sqlite.transaction(() => {
  for (const brand of BRANDS) {
    insertBrand.run(brand.slug, brand.name, brand.url, brand.productUrl ?? null, brand.category);
  }
});

insertMany();

const count = sqlite.prepare("SELECT COUNT(*) as count FROM brands").get() as { count: number };
console.log(`Seeded ${count.count} brands.`);

// Seed RSS feeds from shared definition
const insertFeed = sqlite.prepare(`
  INSERT OR IGNORE INTO feed_sources (name, url, category)
  VALUES (?, ?, ?)
`);

const insertFeeds = sqlite.transaction(() => {
  for (const feed of FEED_SOURCES) {
    insertFeed.run(feed.name, feed.url, feed.category);
  }
});

insertFeeds();

const feedCount = sqlite.prepare("SELECT COUNT(*) as count FROM feed_sources").get() as { count: number };
console.log(`Seeded ${feedCount.count} RSS feeds.`);

sqlite.close();
console.log("Done.");

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "arc-score.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("foreign_keys = ON");

// Auto-migrate: ensure content_queue table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS content_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    image_data TEXT,
    image_template TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    metadata TEXT NOT NULL DEFAULT '{}',
    priority_score INTEGER NOT NULL DEFAULT 50,
    generated_by TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    posted_at TEXT
  )
`);

// Auto-migrate: add image_data column if missing (for existing databases)
try {
  sqlite.exec(`ALTER TABLE content_queue ADD COLUMN image_data TEXT`);
} catch {
  // Column already exists
}

// Auto-migrate: ensure outreach table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    contact_email TEXT,
    contact_name TEXT,
    contact_title TEXT,
    email_source TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    brand_score INTEGER NOT NULL,
    brand_grade TEXT NOT NULL,
    issue_count INTEGER NOT NULL DEFAULT 0,
    top_issues TEXT NOT NULL DEFAULT '[]',
    report_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    notes TEXT,
    sent_at TEXT,
    replied_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure lightweight_scans table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS lightweight_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    robots_txt_found INTEGER NOT NULL DEFAULT 0,
    blocked_agent_count INTEGER NOT NULL DEFAULT 0,
    allowed_agent_count INTEGER NOT NULL DEFAULT 0,
    platform TEXT,
    cdn TEXT,
    waf TEXT,
    has_json_ld INTEGER NOT NULL DEFAULT 0,
    has_schema_product INTEGER NOT NULL DEFAULT 0,
    has_open_graph INTEGER NOT NULL DEFAULT 0,
    has_sitemap INTEGER NOT NULL DEFAULT 0,
    has_product_feed INTEGER NOT NULL DEFAULT 0,
    has_llms_txt INTEGER NOT NULL DEFAULT 0,
    has_ucp INTEGER NOT NULL DEFAULT 0,
    homepage_response_ms INTEGER,
    result_json TEXT NOT NULL,
    agent_status_json TEXT NOT NULL,
    scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure changelog_entries table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS changelog_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    detected_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure pending_changes table exists (two-scan confirmation buffer)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pending_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    first_detected_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmation_type TEXT NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0
  )
`);

// Auto-migrate: add drift_report column to scan_runs (stores JSON drift report)
try {
  sqlite.exec(`ALTER TABLE scan_runs ADD COLUMN drift_report TEXT`);
} catch {
  // Column already exists
}

// Auto-migrate: add llms.txt quality + agents.txt columns to lightweight_scans
for (const stmt of [
  `ALTER TABLE lightweight_scans ADD COLUMN llms_txt_bytes INTEGER`,
  `ALTER TABLE lightweight_scans ADD COLUMN llms_txt_link_count INTEGER`,
  `ALTER TABLE lightweight_scans ADD COLUMN has_agents_txt INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE lightweight_scans ADD COLUMN agents_txt_variant TEXT`,
]) {
  try { sqlite.exec(stmt); } catch { /* column exists */ }
}

// Auto-migrate: ensure feed_sources table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS feed_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'rss',
    active INTEGER NOT NULL DEFAULT 1,
    last_fetched_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure news_articles table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_source_id INTEGER REFERENCES feed_sources(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    published_at TEXT,
    source_type TEXT NOT NULL DEFAULT 'rss',
    relevance_score INTEGER NOT NULL DEFAULT 0,
    relevance_tags TEXT NOT NULL DEFAULT '[]',
    mentioned_brands TEXT NOT NULL DEFAULT '[]',
    full_content TEXT,
    ai_summary TEXT,
    thumbnail_url TEXT,
    content_meta TEXT NOT NULL DEFAULT '{}',
    read INTEGER NOT NULL DEFAULT 0,
    flagged INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure brand_discoveries table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS brand_discoveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT,
    category TEXT,
    discovery_source TEXT NOT NULL DEFAULT 'news_mention',
    source_article_id INTEGER REFERENCES news_articles(id),
    reason TEXT,
    mention_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: ensure suggested_brands table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS suggested_brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT,
    source_article_id INTEGER REFERENCES news_articles(id),
    mention_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: add missing columns to feed_sources
for (const stmt of [
  `ALTER TABLE feed_sources ADD COLUMN source_type TEXT NOT NULL DEFAULT 'rss'`,
]) {
  try { sqlite.exec(stmt); } catch { /* column exists */ }
}

// Auto-migrate: add missing columns to news_articles
for (const stmt of [
  `ALTER TABLE news_articles ADD COLUMN source_type TEXT NOT NULL DEFAULT 'rss'`,
  `ALTER TABLE news_articles ADD COLUMN full_content TEXT`,
  `ALTER TABLE news_articles ADD COLUMN ai_summary TEXT`,
  `ALTER TABLE news_articles ADD COLUMN thumbnail_url TEXT`,
  `ALTER TABLE news_articles ADD COLUMN content_meta TEXT NOT NULL DEFAULT '{}'`,
]) {
  try { sqlite.exec(stmt); } catch { /* column exists */ }
}

// Auto-migrate: add heartbeat column so dead scan processes can be detected
try {
  sqlite.exec(`ALTER TABLE scan_runs ADD COLUMN last_heartbeat_at TEXT`);
} catch { /* column exists */ }

// Auto-migrate: add failure_report column so the latest run can explain failures
try {
  sqlite.exec(`ALTER TABLE scan_runs ADD COLUMN failure_report TEXT`);
} catch { /* column exists */ }

// Auto-migrate: add unsubscribed_at column to customers
try {
  sqlite.exec(`ALTER TABLE customers ADD COLUMN unsubscribed_at TEXT`);
} catch { /* column exists */ }

// Auto-migrate: add unsubscribe column to email_subscribers
try {
  sqlite.exec(`ALTER TABLE email_subscribers ADD COLUMN unsubscribed_at TEXT`);
} catch { /* column exists */ }

// Auto-migrate: watchlists table (Pro feature)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Auto-migrate: email_subscribers table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS email_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'homepage',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export const db = drizzle(sqlite, { schema });
export { schema };

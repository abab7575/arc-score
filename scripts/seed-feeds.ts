/**
 * Idempotent feed seeder — run anytime to add new feeds without duplicates.
 * Usage: npx tsx scripts/seed-feeds.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { FEED_SOURCES } from "../src/lib/news/feed-sources";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "..", "data", "arc-score.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("\n=== ARC Score Feed Seeder ===\n");

// Check if source_type column exists
const columns = sqlite.prepare("PRAGMA table_info(feed_sources)").all() as Array<{ name: string }>;
const hasSourceType = columns.some((c) => c.name === "source_type");

const insertFeed = hasSourceType
  ? sqlite.prepare(`
      INSERT OR IGNORE INTO feed_sources (name, url, category, source_type)
      VALUES (?, ?, ?, ?)
    `)
  : sqlite.prepare(`
      INSERT OR IGNORE INTO feed_sources (name, url, category)
      VALUES (?, ?, ?)
    `);

let added = 0;
const insertAll = sqlite.transaction(() => {
  for (const feed of FEED_SOURCES) {
    const result = hasSourceType
      ? insertFeed.run(feed.name, feed.url, feed.category, feed.sourceType || "rss")
      : insertFeed.run(feed.name, feed.url, feed.category);
    if (result.changes > 0) added++;
  }
});

insertAll();

const total = sqlite.prepare("SELECT COUNT(*) as count FROM feed_sources").get() as { count: number };

console.log(`Feed sources in definition: ${FEED_SOURCES.length}`);
console.log(`New feeds added: ${added}`);
console.log(`Total feeds in DB: ${total.count}`);
console.log("\nDone.\n");

sqlite.close();

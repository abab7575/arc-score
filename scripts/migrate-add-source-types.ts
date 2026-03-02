/**
 * Migration script — adds sourceType and content columns to feed_sources and news_articles.
 *
 * Usage: npx tsx scripts/migrate-add-source-types.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "..", "data", "arc-score.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("\n=== Source Types Migration ===\n");

// Helper to check if column exists
function columnExists(table: string, column: string): boolean {
  const info = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return info.some((col) => col.name === column);
}

// Add columns to feed_sources
if (!columnExists("feed_sources", "source_type")) {
  sqlite.exec(`ALTER TABLE feed_sources ADD COLUMN source_type TEXT NOT NULL DEFAULT 'rss'`);
  console.log("Added source_type to feed_sources.");
} else {
  console.log("feed_sources.source_type already exists.");
}

// Add columns to news_articles
const newsColumns: [string, string][] = [
  ["source_type", "TEXT NOT NULL DEFAULT 'rss'"],
  ["full_content", "TEXT"],
  ["ai_summary", "TEXT"],
  ["thumbnail_url", "TEXT"],
  ["content_meta", "TEXT NOT NULL DEFAULT '{}'"],
  ["archived", "INTEGER NOT NULL DEFAULT 0"],
];

for (const [col, def] of newsColumns) {
  if (!columnExists("news_articles", col)) {
    sqlite.exec(`ALTER TABLE news_articles ADD COLUMN ${col} ${def}`);
    console.log(`Added ${col} to news_articles.`);
  } else {
    console.log(`news_articles.${col} already exists.`);
  }
}

console.log("\nDone.\n");
sqlite.close();

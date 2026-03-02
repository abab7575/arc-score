/**
 * Migration script — creates brand_discoveries table and copies existing
 * suggestedBrands data into it.
 *
 * Usage: npx tsx scripts/migrate-brand-discoveries.ts
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

console.log("\n=== Brand Discoveries Migration ===\n");

// Create the brand_discoveries table
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
console.log("Created brand_discoveries table (if not exists).");

// Copy existing suggested brands into brand_discoveries
const existing = sqlite.prepare("SELECT COUNT(*) as count FROM brand_discoveries").get() as { count: number };

if (existing.count === 0) {
  const statusMap: Record<string, string> = {
    pending: "pending",
    added: "tracking",
    dismissed: "skipped",
  };

  const suggestions = sqlite
    .prepare("SELECT * FROM suggested_brands")
    .all() as Array<{
      id: number;
      name: string;
      url: string | null;
      source_article_id: number | null;
      mention_count: number;
      status: string;
      created_at: string;
    }>;

  const insert = sqlite.prepare(`
    INSERT INTO brand_discoveries (name, url, discovery_source, source_article_id, reason, mention_count, status, created_at)
    VALUES (?, ?, 'news_mention', ?, 'Migrated from suggested brands', ?, ?, ?)
  `);

  const migrateAll = sqlite.transaction(() => {
    for (const s of suggestions) {
      insert.run(
        s.name,
        s.url,
        s.source_article_id,
        s.mention_count,
        statusMap[s.status] || "pending",
        s.created_at
      );
    }
  });

  migrateAll();
  console.log(`Migrated ${suggestions.length} suggested brands → brand_discoveries.`);
} else {
  console.log(`brand_discoveries already has ${existing.count} rows, skipping migration.`);
}

const total = sqlite.prepare("SELECT COUNT(*) as count FROM brand_discoveries").get() as { count: number };
console.log(`Total brand discoveries: ${total.count}`);
console.log("\nDone.\n");

sqlite.close();

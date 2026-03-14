/**
 * Migration script — creates content_queue table.
 *
 * Usage: npx tsx scripts/migrate-content-queue.ts
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

console.log("\n=== Content Queue Migration ===\n");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS content_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
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
console.log("Created content_queue table (if not exists).");

const total = sqlite.prepare("SELECT COUNT(*) as count FROM content_queue").get() as { count: number };
console.log(`Total content queue items: ${total.count}`);
console.log("\nDone.\n");

sqlite.close();

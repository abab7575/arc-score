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

export const db = drizzle(sqlite, { schema });
export { schema };

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

export const db = drizzle(sqlite, { schema });
export { schema };

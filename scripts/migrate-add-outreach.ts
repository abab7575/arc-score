/**
 * Migration: Add outreach table
 * Run: npx tsx scripts/migrate-add-outreach.ts
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const { db } = await import(path.join(projectRoot, "src/lib/db/index"));
  const sqlite = (db as unknown as { $client: { exec: (sql: string) => void } }).$client;

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
    );
  `);

  console.log("Migration complete: outreach table created");
}

main().catch(console.error);

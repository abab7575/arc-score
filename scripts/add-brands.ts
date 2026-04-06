/**
 * Bulk add brands from command line.
 *
 * Usage:
 *   npx tsx scripts/add-brands.ts "Brand Name" "https://brandsite.com" "category"
 *   npx tsx scripts/add-brands.ts --csv brands.csv
 *
 * CSV format (no header):
 *   Nike,https://nike.com,fashion
 *   Adidas,https://adidas.com,fashion
 *
 * Categories: fashion, electronics, beauty, home, food-beverage, dtc, luxury,
 *   sports, general, health, grocery, kids, pet, automotive
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "arc-score.db");

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function addBrand(name: string, url: string, category: string): boolean {
  const slug = slugify(name);
  // Normalize URL
  if (!url.startsWith("http")) url = `https://${url}`;

  // Check if already exists
  const existing = execSync(
    `sqlite3 -json "${dbPath}" "SELECT id FROM brands WHERE slug = '${slug.replace(/'/g, "''")}'"`
  , { encoding: "utf-8" }).trim();

  if (existing && existing !== "[]") {
    console.log(`  SKIP  ${name} (${slug}) — already exists`);
    return false;
  }

  const sql = `INSERT INTO brands (slug, name, url, category, active, created_at) VALUES ('${slug.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', '${url.replace(/'/g, "''")}', '${category}', 1, datetime('now'))`;
  execSync(`sqlite3 "${dbPath}" "${sql}"`);
  console.log(`  ADDED ${name} (${slug}) — ${category} — ${url}`);
  return true;
}

// Parse args
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage:");
  console.log('  npx tsx scripts/add-brands.ts "Brand Name" "https://site.com" "category"');
  console.log('  npx tsx scripts/add-brands.ts --csv path/to/brands.csv');
  console.log("");
  console.log("Categories: fashion, electronics, beauty, home, food-beverage, dtc,");
  console.log("  luxury, sports, general, health, grocery, kids, pet, automotive");
  process.exit(0);
}

let added = 0;
let skipped = 0;

if (args[0] === "--csv") {
  const csvPath = args[1];
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n");
  console.log(`\nAdding ${lines.length} brands from ${csvPath}:\n`);
  for (const line of lines) {
    const parts = line.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) continue;
    const [name, url, category] = parts;
    if (addBrand(name, url, category || "general")) added++;
    else skipped++;
  }
} else {
  const [name, url, category] = args;
  if (!name || !url) {
    console.error("Need at least name and URL");
    process.exit(1);
  }
  if (addBrand(name, url, category || "general")) added++;
  else skipped++;
}

console.log(`\nDone: ${added} added, ${skipped} skipped`);
if (added > 0) {
  console.log("New brands will be scanned on the next daily run (2 AM UTC).");
  console.log("Or trigger a scan now: npx tsx scripts/trigger-scan.ts");
}

/**
 * Bulk brand import script — reads a CSV file and imports brands into the database.
 * Skips duplicates (by slug or URL). Newly imported brands will be picked up
 * by the next daily scan automatically.
 *
 * Usage:
 *   npx tsx scripts/bulk-import.ts [path-to-csv]
 *   npx tsx scripts/bulk-import.ts                     # defaults to data/seed-brands.csv
 *   npx tsx scripts/bulk-import.ts --dry-run           # preview without inserting
 *
 * CSV format (header row required):
 *   name,url,category,productUrl
 *   Nike,https://www.nike.com,fashion,
 *   Allbirds,https://www.allbirds.com,dtc,https://www.allbirds.com/products/mens-tree-runners
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Handle quoted fields with commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

const VALID_CATEGORIES = [
  "fashion", "electronics", "home", "beauty", "grocery",
  "general", "dtc", "luxury", "sports", "health", "pet",
  "kids", "automotive", "food-beverage",
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--")) ??
    path.join(projectRoot, "data", "seed-brands.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error("Usage: npx tsx scripts/bulk-import.ts [path-to-csv]");
    process.exit(1);
  }

  // Import DB modules
  const dbModule = await import(path.join(projectRoot, "src/lib/db/index.ts"));
  const { db, schema } = dbModule;
  const { eq, or } = await import("drizzle-orm");

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);

  console.log(`\n=== ARC Score Bulk Brand Import ===`);
  console.log(`CSV: ${csvPath}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`===================================\n`);

  // Get existing brands for dedup
  const existing = db.select({
    slug: schema.brands.slug,
    url: schema.brands.url,
  }).from(schema.brands).all();

  const existingSlugs = new Set(existing.map((b: { slug: string }) => b.slug));
  const existingUrls = new Set(existing.map((b: { url: string }) => b.url.replace(/\/$/, "").toLowerCase()));

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const results: { name: string; slug: string; status: string }[] = [];

  for (const row of rows) {
    const name = row.name?.trim();
    const url = row.url?.trim();
    const category = row.category?.trim().toLowerCase() || "general";
    const productUrl = row.producturl?.trim() || row["product_url"]?.trim() || undefined;

    if (!name || !url) {
      console.warn(`  [SKIP] Missing name or URL: ${JSON.stringify(row)}`);
      results.push({ name: name || "?", slug: "?", status: "missing-fields" });
      errors++;
      continue;
    }

    const slug = slugify(name);
    const normalizedUrl = url.replace(/\/$/, "").toLowerCase();

    // Dedup check
    if (existingSlugs.has(slug)) {
      results.push({ name, slug, status: "duplicate-slug" });
      skipped++;
      continue;
    }
    if (existingUrls.has(normalizedUrl)) {
      results.push({ name, slug, status: "duplicate-url" });
      skipped++;
      continue;
    }

    // Validate category
    const validCategory = VALID_CATEGORIES.includes(category) ? category : "general";
    if (validCategory !== category) {
      console.warn(`  [WARN] Unknown category "${category}" for ${name}, defaulting to "general"`);
    }

    if (!dryRun) {
      try {
        db.insert(schema.brands).values({
          slug,
          name,
          url,
          productUrl: productUrl || null,
          category: validCategory,
          active: true,
        }).run();

        existingSlugs.add(slug);
        existingUrls.add(normalizedUrl);
        results.push({ name, slug, status: "imported" });
        imported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] ${name}: ${msg}`);
        results.push({ name, slug, status: `error: ${msg}` });
        errors++;
      }
    } else {
      results.push({ name, slug, status: "would-import" });
      imported++;
    }
  }

  // Summary
  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${rows.length}`);

  if (dryRun) {
    console.log(`\n[DRY RUN] No changes were made. Remove --dry-run to import.`);
  }

  // Show breakdown by category
  const importedRows = results.filter((r) => r.status === "imported" || r.status === "would-import");
  if (importedRows.length > 0) {
    console.log(`\nImported brands:`);
    importedRows.forEach((r) => console.log(`  + ${r.name} (${r.slug})`));
  }

  const skippedRows = results.filter((r) => r.status.startsWith("duplicate"));
  if (skippedRows.length > 0) {
    console.log(`\nSkipped (already exist):`);
    skippedRows.forEach((r) => console.log(`  - ${r.name} (${r.status})`));
  }
}

main().catch(console.error);

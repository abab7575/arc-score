/**
 * Daily scan script — scans all active brands with concurrency control,
 * retry logic, and scan logging.
 *
 * Usage:
 *   npx tsx scripts/daily-scan.ts [--concurrency=3] [--category=fashion] [--retry=2] [--force]
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const concurrency = parseInt(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? process.env.SCAN_CONCURRENCY ?? "2");
  const filterCategory = args.find((a) => a.startsWith("--category="))?.split("=")[1];
  const maxRetries = parseInt(args.find((a) => a.startsWith("--retry="))?.split("=")[1] ?? "2");
  const force = args.includes("--force");
  const staggerMs = parseInt(process.env.SCAN_STAGGER_MS ?? "8000");

  const { scanBrand } = await import(path.join(projectRoot, "src/lib/scanner/scan-orchestrator"));
  const { cleanupOldScreenshots } = await import(path.join(projectRoot, "src/lib/scanner/screenshot-manager"));
  const { db, schema } = await import(path.join(projectRoot, "src/lib/db/index"));
  const { eq } = await import("drizzle-orm");

  // Pull active brands from database (includes bulk-imported brands)
  const dbBrands = db
    .select({
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      productUrl: schema.brands.productUrl,
      category: schema.brands.category,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  let brands = dbBrands.map((b: { slug: string; name: string; url: string; productUrl: string | null; category: string }) => ({
    slug: b.slug,
    name: b.name,
    url: b.url,
    productUrl: b.productUrl ?? undefined,
    category: b.category,
  }));

  if (filterCategory) {
    brands = brands.filter((b: { category: string }) => b.category === filterCategory);
  }

  console.log(`\n=== ARC Score Daily Scan ===`);
  console.log(`Brands: ${brands.length}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Max retries: ${maxRetries}`);
  console.log(`Force re-scan: ${force}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`===========================\n`);

  // Cleanup old screenshots first
  const removed = cleanupOldScreenshots(14);
  if (removed > 0) console.log(`Cleaned up ${removed} old screenshot directories.\n`);

  const results: { slug: string; score: number; grade: string; duration: number; error?: string; attempts: number }[] = [];
  let completed = 0;

  // Retry helper with exponential backoff
  async function scanWithRetry(brand: { slug: string; name: string }, retries: number): Promise<{ slug: string; score: number; grade: string; duration: number; error?: string; attempts: number }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const result = await scanBrand(brand, { force });
        return {
          slug: brand.slug,
          score: result.report.overallScore,
          grade: result.report.grade,
          duration: result.duration,
          attempts: attempt,
        };
      } catch (err) {
        lastError = err as Error;
        if (attempt <= retries) {
          const delay = Math.pow(2, attempt - 1) * 5000; // 5s, 10s, 20s...
          console.warn(`[RETRY] ${brand.slug} attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    return {
      slug: brand.slug,
      score: 0,
      grade: "F",
      duration: 0,
      error: lastError?.message ?? "Unknown error",
      attempts: retries + 1,
    };
  }

  // Process in batches with stagger
  for (let i = 0; i < brands.length; i += concurrency) {
    const batch = brands.slice(i, i + concurrency);

    const batchPromises = batch.map(async (brand: { slug: string; name: string }, batchIndex: number) => {
      // Stagger starts within each batch
      if (batchIndex > 0) {
        await new Promise((r) => setTimeout(r, batchIndex * staggerMs));
      }

      const result = await scanWithRetry(brand, maxRetries);
      results.push(result);

      completed++;
      const pct = Math.round((completed / brands.length) * 100);
      console.log(`Progress: ${completed}/${brands.length} (${pct}%) — ${brand.slug}: ${result.score}/100 ${result.error ? `[ERROR after ${result.attempts} attempts]` : `[${result.attempts} attempt(s)]`}\n`);
    });

    await Promise.all(batchPromises);
  }

  // Summary
  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const avgScore = successful.length > 0
    ? Math.round(successful.reduce((s, r) => s + r.score, 0) / successful.length)
    : 0;

  console.log(`\n=== Scan Complete ===`);
  console.log(`Total: ${results.length} brands`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Avg score: ${avgScore}`);
  console.log(`Duration: ${Math.round(results.reduce((s, r) => s + r.duration, 0) / 1000)}s total\n`);

  // Leaderboard
  const sorted = [...successful].sort((a, b) => b.score - a.score);
  console.log("Top 10:");
  sorted.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.slug}: ${r.score}/100 (${r.grade})`);
  });

  if (failed.length > 0) {
    console.log("\nFailed brands:");
    failed.forEach((r) => {
      console.log(`  ${r.slug}: ${r.error} (${r.attempts} attempts)`);
    });
  }

  // Write scan log
  const logDir = path.join(projectRoot, "data", "scan-logs");
  fs.mkdirSync(logDir, { recursive: true });

  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(logDir, `${today}.json`);
  const logData = {
    date: today,
    startedAt: new Date().toISOString(),
    config: { concurrency, maxRetries, force, filterCategory },
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      avgScore,
    },
    results,
  };

  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
  console.log(`\nScan log written to ${logFile}`);
}

main().catch(console.error);

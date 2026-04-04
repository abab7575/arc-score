/**
 * Daily Lightweight Scan — HTTP-only scan of all active brands.
 * No Puppeteer, no Claude API. Runs ~500 brands in 5-10 minutes.
 *
 * Usage:
 *   npx tsx scripts/daily-lightweight-scan.ts [--concurrency=20] [--category=fashion]
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const concurrency = parseInt(args.find(a => a.startsWith("--concurrency="))?.split("=")[1] ?? "20");
  const filterCategory = args.find(a => a.startsWith("--category="))?.split("=")[1];
  const staggerMs = 500;

  const { runLightweightScan } = await import(path.join(projectRoot, "src/lib/scanner/lightweight-scanner"));
  const { db, schema } = await import(path.join(projectRoot, "src/lib/db/index"));
  const { insertLightweightScan, getLatestLightweightScan } = await import(path.join(projectRoot, "src/lib/db/queries"));
  const { eq } = await import("drizzle-orm");

  // Pull active brands from database
  const dbBrands = db
    .select({
      id: schema.brands.id,
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      productUrl: schema.brands.productUrl,
      category: schema.brands.category,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  let brands = dbBrands;
  if (filterCategory) {
    brands = brands.filter(b => b.category === filterCategory);
  }

  // Prioritize unscanned brands first so new additions get data immediately
  const scannedIds = new Set(
    db.select({ id: schema.lightweightScans.brandId })
      .from(schema.lightweightScans)
      .all()
      .map((r: { id: number }) => r.id)
  );
  const unscanned = brands.filter(b => !scannedIds.has(b.id));
  const alreadyScanned = brands.filter(b => scannedIds.has(b.id));
  brands = [...unscanned, ...alreadyScanned];
  console.log(`Unscanned (priority): ${unscanned.length}, Already scanned: ${alreadyScanned.length}`);

  console.log(`\n=== ARC Lightweight Daily Scan ===`);
  console.log(`Brands: ${brands.length}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`=================================\n`);

  const results: { slug: string; blockedAgents: number; platform: string; duration: number; error?: string }[] = [];
  let completed = 0;

  // Process in batches
  for (let i = 0; i < brands.length; i += concurrency) {
    const batch = brands.slice(i, i + concurrency);

    const batchPromises = batch.map(async (brand, batchIndex) => {
      // Stagger starts within each batch
      if (batchIndex > 0) {
        await new Promise(r => setTimeout(r, batchIndex * staggerMs));
      }

      try {
        // Per-brand timeout: 60 seconds max, then skip
        const result = await Promise.race([
          runLightweightScan(brand.url, brand.productUrl ?? undefined),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout scanning ${brand.slug} after 60s`)), 60000)),
        ]);

        // Store in database
        insertLightweightScan(brand.id, result);

        const blockedCount = result.userAgentTests.filter(t => t.verdict === "blocked").length;

        results.push({
          slug: brand.slug,
          blockedAgents: blockedCount,
          platform: result.platform.platform,
          duration: result.scanDurationMs,
        });

        completed++;
        const pct = Math.round((completed / brands.length) * 100);
        console.log(
          `[${completed}/${brands.length}] ${pct}% — ${brand.slug}: ` +
          `${result.platform.platform} | ${blockedCount} agents blocked | ` +
          `${result.scanDurationMs}ms`
        );
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        results.push({
          slug: brand.slug,
          blockedAgents: -1,
          platform: "error",
          duration: 0,
          error,
        });

        completed++;
        console.error(`[${completed}/${brands.length}] ${brand.slug}: ERROR — ${error}`);
      }
    });

    await Promise.all(batchPromises);
  }

  // Generate changelog by comparing with previous scans
  console.log("\n--- Generating changelog ---");
  const changelogCount = await generateChangelog(brands, projectRoot);
  console.log(`Changelog: ${changelogCount} changes detected\n`);

  // Summary
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);

  console.log(`\n=== Scan Complete ===`);
  console.log(`Total: ${results.length} brands`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total scan time: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Wall clock time: ${Math.round((Date.now() - startTime) / 1000)}s\n`);

  // Platform breakdown
  const platforms: Record<string, number> = {};
  for (const r of successful) {
    platforms[r.platform] = (platforms[r.platform] ?? 0) + 1;
  }
  console.log("Platform breakdown:");
  Object.entries(platforms)
    .sort(([, a], [, b]) => b - a)
    .forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count}`);
    });

  // Blocking stats
  const totalBlocked = successful.filter(r => r.blockedAgents > 0).length;
  console.log(`\nBrands blocking any agent: ${totalBlocked}/${successful.length} (${Math.round(totalBlocked / successful.length * 100)}%)`);

  if (failed.length > 0) {
    console.log("\nFailed brands:");
    failed.forEach(r => console.log(`  ${r.slug}: ${r.error}`));
  }

  // Write scan log
  const logDir = path.join(projectRoot, "data", "scan-logs");
  fs.mkdirSync(logDir, { recursive: true });

  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(logDir, `lightweight-${today}.json`);
  fs.writeFileSync(logFile, JSON.stringify({
    date: today,
    startedAt: new Date().toISOString(),
    config: { concurrency, filterCategory },
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      platforms,
      totalBlocked,
    },
    results,
  }, null, 2));

  console.log(`\nScan log written to ${logFile}`);
}

const startTime = Date.now();

/**
 * Compare today's scans with previous scans and insert changelog entries for differences.
 */
async function generateChangelog(
  brands: Array<{ id: number; slug: string }>,
  projectRoot: string
): Promise<number> {
  const { getPreviousLightweightScan, getLatestLightweightScan, insertChangelogEntry } = await import(
    path.join(projectRoot, "src/lib/db/queries")
  );

  let changeCount = 0;

  for (const brand of brands) {
    const latest = getLatestLightweightScan(brand.id);
    if (!latest) continue;

    const previous = getPreviousLightweightScan(brand.id, latest.scannedAt);
    if (!previous) continue; // First scan, no comparison possible

    // Compare key fields
    const fields: Array<{ field: string; oldVal: string | null; newVal: string | null }> = [];

    if (latest.platform !== previous.platform) {
      fields.push({ field: "platform", oldVal: previous.platform, newVal: latest.platform });
    }
    if (latest.cdn !== previous.cdn) {
      fields.push({ field: "cdn", oldVal: previous.cdn, newVal: latest.cdn });
    }
    if (latest.waf !== previous.waf) {
      fields.push({ field: "waf", oldVal: previous.waf, newVal: latest.waf });
    }
    if (latest.blockedAgentCount !== previous.blockedAgentCount) {
      fields.push({ field: "blocked_agent_count", oldVal: String(previous.blockedAgentCount), newVal: String(latest.blockedAgentCount) });
    }
    if (latest.hasJsonLd !== previous.hasJsonLd) {
      fields.push({ field: "json_ld", oldVal: String(previous.hasJsonLd), newVal: String(latest.hasJsonLd) });
    }
    if (latest.hasSchemaProduct !== previous.hasSchemaProduct) {
      fields.push({ field: "schema_product", oldVal: String(previous.hasSchemaProduct), newVal: String(latest.hasSchemaProduct) });
    }
    if (latest.hasOpenGraph !== previous.hasOpenGraph) {
      fields.push({ field: "open_graph", oldVal: String(previous.hasOpenGraph), newVal: String(latest.hasOpenGraph) });
    }
    if (latest.hasProductFeed !== previous.hasProductFeed) {
      fields.push({ field: "product_feed", oldVal: String(previous.hasProductFeed), newVal: String(latest.hasProductFeed) });
    }
    if (latest.hasLlmsTxt !== previous.hasLlmsTxt) {
      fields.push({ field: "llms_txt", oldVal: String(previous.hasLlmsTxt), newVal: String(latest.hasLlmsTxt) });
    }
    if (latest.hasUcp !== previous.hasUcp) {
      fields.push({ field: "ucp", oldVal: String(previous.hasUcp), newVal: String(latest.hasUcp) });
    }

    // Compare per-agent status changes
    try {
      const latestAgents = JSON.parse(latest.agentStatusJson) as Record<string, string>;
      const previousAgents = JSON.parse(previous.agentStatusJson) as Record<string, string>;

      for (const agent of Object.keys(latestAgents)) {
        if (latestAgents[agent] !== previousAgents[agent]) {
          fields.push({
            field: `agent_access_${agent}`,
            oldVal: previousAgents[agent] ?? "unknown",
            newVal: latestAgents[agent],
          });
        }
      }
    } catch {
      // JSON parse error, skip agent comparison
    }

    // Insert changelog entries
    for (const { field, oldVal, newVal } of fields) {
      insertChangelogEntry(brand.id, field, oldVal, newVal);
      changeCount++;
      console.log(`  [changelog] ${brand.slug}: ${field} changed from "${oldVal}" to "${newVal}"`);
    }
  }

  return changeCount;
}

main().catch(console.error);

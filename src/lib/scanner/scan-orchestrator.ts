/**
 * Scan Orchestrator — runs all three agents against a single brand,
 * produces a scored report, and writes to the database.
 */

import { runDataAgent } from "./data-agent";
import { runBrowserAgent } from "./browser-agent";
import { runAccessibilityAgent } from "./accessibility-agent";
import { runVisualAgent } from "./visual-agent";
import { runFeedAgent } from "./feed-agent";
import { buildReport } from "./scoring-engine";
import { getScreenshotDir, getScreenshotUrlPrefix } from "./screenshot-manager";
import { getBrandBySlug, getLatestScanForBrand, insertScan } from "@/lib/db/queries";
import type { ScanReport } from "@/types/report";
import type { BrandEntry } from "@/lib/brands";

export interface ScanResult {
  brandSlug: string;
  report: ScanReport;
  scanId: number;
  duration: number;
}

export interface ScanOptions {
  force?: boolean;
  /** Skip visual agent (runs weekly, not daily) */
  skipVisual?: boolean;
  /** Skip feed agent (runs weekly, not daily) */
  skipFeed?: boolean;
}

/**
 * Check if a brand was already scanned today.
 */
export function wasScannedToday(brandId: number): boolean {
  const latest = getLatestScanForBrand(brandId);
  if (!latest) return false;

  const today = new Date().toISOString().split("T")[0];
  const scanDate = latest.scannedAt.split("T")[0];
  return scanDate === today;
}

export async function scanBrand(brand: BrandEntry, options: ScanOptions = {}): Promise<ScanResult> {
  const start = Date.now();

  // Re-scan guard: skip if already scanned today (unless --force)
  if (!options.force) {
    const dbBrand = getBrandBySlug(brand.slug);
    if (dbBrand && wasScannedToday(dbBrand.id)) {
      console.log(`[${brand.slug}] Already scanned today. Use --force to override.`);
      const latest = getLatestScanForBrand(dbBrand.id)!;
      const report = JSON.parse(latest.reportJson) as ScanReport;
      return {
        brandSlug: brand.slug,
        report,
        scanId: latest.id,
        duration: 0,
      };
    }
  }

  console.log(`\n=== Scanning ${brand.name} (${brand.url}) ===\n`);

  const screenshotDir = getScreenshotDir(brand.slug);
  const screenshotUrlPrefix = getScreenshotUrlPrefix(brand.slug);

  // Run all agents — browser first so we can share rendered HTML with data agent
  console.log(`[${brand.slug}] Starting Browser Agent...`);
  const browserResult = await runBrowserAgent(brand.url, brand.productUrl, {
    screenshotDir,
    screenshotUrlPrefix,
  });

  // Pass browser-rendered HTML to data agent for JS-rendered schema detection
  const renderedHtml = browserResult.renderedProductHtml;
  console.log(`[${brand.slug}] Starting Data Agent...`);
  const dataResult = await runDataAgent(brand.url, brand.productUrl, renderedHtml);

  console.log(`[${brand.slug}] Starting Accessibility Agent...`);
  const a11yResult = await runAccessibilityAgent(brand.url, brand.productUrl);

  // Visual + Feed agents run weekly (not daily) to manage API costs
  let visualResult;
  let feedResult;

  if (!options.skipVisual) {
    console.log(`[${brand.slug}] Starting Visual Agent...`);
    visualResult = await runVisualAgent(brand.url, brand.productUrl, {
      screenshotDir,
      screenshotUrlPrefix,
    });
  } else {
    console.log(`[${brand.slug}] Skipping Visual Agent (weekly only)`);
  }

  if (!options.skipFeed) {
    console.log(`[${brand.slug}] Starting Feed Agent...`);
    feedResult = await runFeedAgent(brand.url, brand.productUrl);
  } else {
    console.log(`[${brand.slug}] Skipping Feed Agent (weekly only)`);
  }

  // Build report
  console.log(`[${brand.slug}] Calculating score...`);
  const report = buildReport(
    `scan-${brand.slug}-${Date.now()}`,
    brand.url,
    dataResult,
    browserResult,
    a11yResult,
    visualResult,
    feedResult
  );

  // Save to DB
  const dbBrand = getBrandBySlug(brand.slug);
  if (!dbBrand) {
    throw new Error(`Brand ${brand.slug} not found in database. Run seed first.`);
  }

  const scanId = insertScan(dbBrand.id, report);
  const duration = Date.now() - start;

  console.log(`[${brand.slug}] Score: ${report.overallScore}/100 (Grade ${report.grade}) — ${Math.round(duration / 1000)}s`);

  return {
    brandSlug: brand.slug,
    report,
    scanId,
    duration,
  };
}

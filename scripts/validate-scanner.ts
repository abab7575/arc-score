/**
 * Scanner Validation Framework
 *
 * Runs independent verification checks against real sites to catch
 * false negatives/positives in our scanning agents. Compares what
 * our scanner reports vs. what's actually on the site.
 *
 * Usage:
 *   npx tsx scripts/validate-scanner.ts [--brands=nike,adidas,apple]
 *   npx tsx scripts/validate-scanner.ts --all        # validate all brands with scans
 *   npx tsx scripts/validate-scanner.ts --top=20     # validate top 20 brands
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

interface ValidationResult {
  check: string;
  scannerSays: string;
  validatorSays: string;
  match: boolean;
  severity: "critical" | "high" | "medium" | "low";
  detail?: string;
}

interface BrandValidation {
  brand: string;
  url: string;
  results: ValidationResult[];
  falseNegatives: number;
  falsePositives: number;
  accurate: number;
  total: number;
  accuracy: number;
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}

// ── Validation Checks ────────────────────────────────────────────

async function validateSitemap(baseUrl: string): Promise<{
  found: boolean;
  source: string;
  detail: string;
}> {
  // 1. Check robots.txt for Sitemap: directives
  const robotsRes = await fetchWithTimeout(`${baseUrl}/robots.txt`);
  if (robotsRes?.ok) {
    const content = await robotsRes.text();
    // Make sure it's actually robots.txt, not an HTML error page
    if (!content.startsWith("<!") && !content.startsWith("<html")) {
      const sitemapMatches = content.match(/^Sitemap:\s*(.+)$/gim);
      if (sitemapMatches && sitemapMatches.length > 0) {
        return {
          found: true,
          source: "robots.txt",
          detail: `${sitemapMatches.length} Sitemap directive(s) in robots.txt`,
        };
      }
    }
  }

  // 2. Try common sitemap paths
  const paths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap/sitemap.xml",
    "/sitemaps/sitemap.xml",
  ];

  for (const p of paths) {
    const res = await fetchWithTimeout(`${baseUrl}${p}`);
    if (res?.ok) {
      const text = await res.text();
      if (text.includes("<urlset") || text.includes("<sitemapindex")) {
        return { found: true, source: p, detail: `Valid XML sitemap at ${p}` };
      }
    }
  }

  return { found: false, source: "none", detail: "No sitemap found via robots.txt or common paths" };
}

async function validateSchemaOrg(productUrl: string): Promise<{
  found: boolean;
  type: string;
  detail: string;
}> {
  const res = await fetchWithTimeout(productUrl, 15000);
  if (!res?.ok) {
    return { found: false, type: "none", detail: `Could not fetch page (HTTP ${res?.status ?? "timeout"})` };
  }

  const html = await res.text();

  // Check for JSON-LD Product schema
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const productTypes = ["Product", "ProductGroup", "IndividualProduct", "ProductModel"];

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const objects = Array.isArray(parsed) ? parsed : [parsed];

      for (const obj of objects) {
        const item = obj as Record<string, unknown>;

        // Direct type match
        if (typeof item["@type"] === "string" && productTypes.includes(item["@type"])) {
          return { found: true, type: item["@type"], detail: `JSON-LD ${item["@type"]} found` };
        }
        if (Array.isArray(item["@type"]) && item["@type"].some((t: string) => productTypes.includes(t))) {
          return { found: true, type: String(item["@type"]), detail: `JSON-LD ${item["@type"]} found` };
        }

        // Check @graph
        if (Array.isArray(item["@graph"])) {
          for (const g of item["@graph"] as Record<string, unknown>[]) {
            if (typeof g["@type"] === "string" && productTypes.includes(g["@type"])) {
              return { found: true, type: g["@type"], detail: `JSON-LD ${g["@type"]} found in @graph` };
            }
          }
        }
      }
    } catch {
      // Invalid JSON-LD
    }
  }

  // Check for microdata
  if (html.includes('itemtype="http://schema.org/Product"') || html.includes('itemtype="https://schema.org/Product"')) {
    return { found: true, type: "Product (microdata)", detail: "Schema.org Product microdata found" };
  }

  return { found: false, type: "none", detail: "No Product/ProductGroup schema in JSON-LD or microdata" };
}

async function validateRobotsTxt(baseUrl: string): Promise<{
  found: boolean;
  blockedAgents: string[];
  detail: string;
  wafBlocked: boolean;
}> {
  const res = await fetchWithTimeout(`${baseUrl}/robots.txt`);
  if (!res) {
    return { found: false, blockedAgents: [], detail: "Timeout fetching robots.txt", wafBlocked: false };
  }

  if (res.status === 403 || res.status === 429) {
    return { found: false, blockedAgents: [], detail: `WAF blocked access (HTTP ${res.status})`, wafBlocked: true };
  }

  if (!res.ok) {
    return { found: false, blockedAgents: [], detail: `HTTP ${res.status}`, wafBlocked: false };
  }

  const content = await res.text();
  if (content.startsWith("<!") || content.startsWith("<html")) {
    return { found: false, blockedAgents: [], detail: "Got HTML instead of robots.txt (WAF challenge?)", wafBlocked: true };
  }

  const agents = ["GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Amazonbot"];
  const blocked: string[] = [];

  for (const agent of agents) {
    const regex = new RegExp(`User-agent:\\s*${agent}[\\s\\S]*?(?=User-agent:|$)`, "i");
    const section = content.match(regex);
    if (section && /Disallow:\s*\/\s*$/m.test(section[0])) {
      blocked.push(agent);
    }
  }

  return {
    found: true,
    blockedAgents: blocked,
    detail: blocked.length > 0
      ? `Blocks: ${blocked.join(", ")}`
      : "All AI agents allowed",
    wafBlocked: false,
  };
}

async function validateProductPage(url: string): Promise<{
  accessible: boolean;
  htmlSize: number;
  wafBlocked: boolean;
  detail: string;
}> {
  const res = await fetchWithTimeout(url, 15000);
  if (!res) {
    return { accessible: false, htmlSize: 0, wafBlocked: false, detail: "Timeout" };
  }

  if (res.status === 403 || res.status === 429) {
    return { accessible: false, htmlSize: 0, wafBlocked: true, detail: `WAF blocked (HTTP ${res.status})` };
  }

  const html = await res.text();

  // Check for WAF challenge pages
  const wafSignals = [
    "cf-browser-verification",
    "challenge-platform",
    "px-captcha",
    "datadome",
    "Access Denied",
    "Just a moment...",
  ];
  const isWafPage = wafSignals.some((s) => html.includes(s));

  if (isWafPage || html.length < 1000) {
    return { accessible: false, htmlSize: html.length, wafBlocked: true, detail: "WAF challenge page detected" };
  }

  return { accessible: true, htmlSize: html.length, wafBlocked: false, detail: `${Math.round(html.length / 1024)}KB HTML` };
}

// ── Main Validation ────────────────────────────────────────────

async function validateBrand(
  brand: { slug: string; name: string; url: string; productUrl?: string },
  scanReport: { schemaOrg: { found: boolean; type?: string }; sitemap: { found: boolean }; robotsTxt: { found: boolean; blockedAgents: string[] } } | null
): Promise<BrandValidation> {
  const baseUrl = brand.url.startsWith("http") ? brand.url : `https://${brand.url}`;
  const productUrl = brand.productUrl || baseUrl;
  const results: ValidationResult[] = [];

  console.log(`  Validating ${brand.name} (${baseUrl})...`);

  // 1. Validate sitemap
  const sitemapResult = await validateSitemap(baseUrl);
  const scannerSaysSitemap = scanReport?.sitemap.found ? "Found" : "Not found";
  results.push({
    check: "XML Sitemap",
    scannerSays: scannerSaysSitemap,
    validatorSays: sitemapResult.found ? `Found (${sitemapResult.source})` : "Not found",
    match: (scanReport?.sitemap.found ?? false) === sitemapResult.found,
    severity: "critical",
    detail: sitemapResult.detail,
  });

  // 2. Validate Schema.org
  const schemaResult = await validateSchemaOrg(productUrl);
  const scannerSaysSchema = scanReport?.schemaOrg.found ? `Found (${scanReport.schemaOrg.type})` : "Not found";
  results.push({
    check: "Schema.org Product",
    scannerSays: scannerSaysSchema,
    validatorSays: schemaResult.found ? `Found (${schemaResult.type})` : "Not found",
    match: (scanReport?.schemaOrg.found ?? false) === schemaResult.found,
    severity: "critical",
    detail: schemaResult.detail,
  });

  // 3. Validate robots.txt
  const robotsResult = await validateRobotsTxt(baseUrl);
  if (robotsResult.wafBlocked) {
    results.push({
      check: "robots.txt",
      scannerSays: scanReport?.robotsTxt.found ? "Found" : "Not found",
      validatorSays: "WAF blocked",
      match: false,
      severity: "high",
      detail: robotsResult.detail,
    });
  } else {
    results.push({
      check: "robots.txt",
      scannerSays: scanReport?.robotsTxt.found ? "Found" : "Not found",
      validatorSays: robotsResult.found ? "Found" : "Not found",
      match: (scanReport?.robotsTxt.found ?? false) === robotsResult.found,
      severity: "medium",
      detail: robotsResult.detail,
    });
  }

  // 4. Validate product page accessibility
  const pageResult = await validateProductPage(productUrl);
  if (pageResult.wafBlocked) {
    results.push({
      check: "Product Page Access",
      scannerSays: "Scanned",
      validatorSays: "WAF blocked",
      match: false,
      severity: "critical",
      detail: `${pageResult.detail} — scanner results for this brand may be unreliable`,
    });
  }

  const falseNegatives = results.filter((r) => !r.match && r.scannerSays.includes("Not found") && r.validatorSays.includes("Found")).length;
  const falsePositives = results.filter((r) => !r.match && r.scannerSays.includes("Found") && r.validatorSays.includes("Not found")).length;
  const accurate = results.filter((r) => r.match).length;

  return {
    brand: brand.name,
    url: brand.url,
    results,
    falseNegatives,
    falsePositives,
    accurate,
    total: results.length,
    accuracy: results.length > 0 ? Math.round((accurate / results.length) * 100) : 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const brandFilter = args.find((a) => a.startsWith("--brands="))?.split("=")[1]?.split(",");
  const topN = parseInt(args.find((a) => a.startsWith("--top="))?.split("=")[1] ?? "0");
  const all = args.includes("--all");

  const { db, schema } = await import(path.join(projectRoot, "src/lib/db/index"));
  const { eq, desc } = await import("drizzle-orm");

  // Get brands to validate
  let brands = db
    .select({
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      productUrl: schema.brands.productUrl,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  if (brandFilter) {
    brands = brands.filter((b: { slug: string }) => brandFilter.includes(b.slug));
  } else if (topN > 0) {
    brands = brands.slice(0, topN);
  } else if (!all) {
    // Default: validate first 10
    brands = brands.slice(0, 10);
  }

  console.log(`\n=== ARC Score Scanner Validation ===`);
  console.log(`Brands to validate: ${brands.length}`);
  console.log(`====================================\n`);

  // Get latest scan results for comparison
  const validations: BrandValidation[] = [];

  for (const brand of brands) {
    // Get latest scan report for this brand
    let scanReport = null;
    const dbBrand = db
      .select({ id: schema.brands.id })
      .from(schema.brands)
      .where(eq(schema.brands.slug, brand.slug))
      .get();

    if (dbBrand) {
      const latestScan = db
        .select({ reportJson: schema.scans.reportJson })
        .from(schema.scans)
        .where(eq(schema.scans.brandId, dbBrand.id))
        .orderBy(desc(schema.scans.scannedAt))
        .limit(1)
        .get();

      if (latestScan) {
        try {
          const report = JSON.parse(latestScan.reportJson);
          // Extract the data agent results from the report
          const dataJourney = report.journeys?.find((j: { agentType: string }) => j.agentType === "data");
          if (dataJourney) {
            const sitemapStep = dataJourney.steps?.find((s: { action: string }) => s.action.includes("sitemap"));
            const schemaStep = dataJourney.steps?.find((s: { action: string }) => s.action.includes("Schema"));
            const robotsStep = dataJourney.steps?.find((s: { action: string }) => s.action.includes("robots"));

            scanReport = {
              schemaOrg: {
                found: schemaStep?.result === "pass",
                type: schemaStep?.narration?.match(/Found (\S+) schema/)?.[1],
              },
              sitemap: { found: sitemapStep?.result === "pass" },
              robotsTxt: {
                found: robotsStep?.result !== "fail",
                blockedAgents: [],
              },
            };
          }
        } catch {
          // Invalid JSON
        }
      }
    }

    const validation = await validateBrand(
      { slug: brand.slug, name: brand.name, url: brand.url, productUrl: brand.productUrl ?? undefined },
      scanReport
    );
    validations.push(validation);
  }

  // ── Report ──

  console.log(`\n${"=".repeat(80)}`);
  console.log("VALIDATION REPORT");
  console.log(`${"=".repeat(80)}\n`);

  let totalFalseNegs = 0;
  let totalFalsePos = 0;
  let totalAccurate = 0;
  let totalChecks = 0;

  for (const v of validations) {
    const icon = v.accuracy === 100 ? "✓" : v.accuracy >= 50 ? "~" : "✗";
    console.log(`${icon} ${v.brand} (${v.accuracy}% accurate)`);

    for (const r of v.results) {
      const matchIcon = r.match ? "  ✓" : "  ✗";
      if (!r.match) {
        console.log(`${matchIcon} [${r.severity.toUpperCase()}] ${r.check}: Scanner says "${r.scannerSays}" but actually "${r.validatorSays}"`);
        if (r.detail) console.log(`      Detail: ${r.detail}`);
      }
    }

    totalFalseNegs += v.falseNegatives;
    totalFalsePos += v.falsePositives;
    totalAccurate += v.accurate;
    totalChecks += v.total;
  }

  const overallAccuracy = totalChecks > 0 ? Math.round((totalAccurate / totalChecks) * 100) : 0;

  console.log(`\n${"=".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(80)}`);
  console.log(`Brands validated: ${validations.length}`);
  console.log(`Total checks: ${totalChecks}`);
  console.log(`Accurate: ${totalAccurate} (${overallAccuracy}%)`);
  console.log(`False negatives: ${totalFalseNegs} (scanner says missing, but it exists)`);
  console.log(`False positives: ${totalFalsePos} (scanner says found, but it doesn't exist)`);
  console.log(`\nBrands with issues:`);

  const problemBrands = validations.filter((v) => v.accuracy < 100);
  if (problemBrands.length === 0) {
    console.log("  None — all checks passed!");
  } else {
    for (const v of problemBrands) {
      const issues = v.results.filter((r) => !r.match);
      console.log(`  ${v.brand}: ${issues.map((i) => `${i.check} (${i.severity})`).join(", ")}`);
    }
  }
}

main().catch(console.error);

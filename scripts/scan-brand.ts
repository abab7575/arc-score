/**
 * Single brand scan script.
 * Usage: npx tsx scripts/scan-brand.ts <slug>
 * Example: npx tsx scripts/scan-brand.ts allbirds
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/scan-brand.ts <slug>");
    console.error("Example: npx tsx scripts/scan-brand.ts allbirds");
    process.exit(1);
  }

  // Dynamic imports using relative paths (tsx doesn't support @ aliases)
  const { BRANDS } = await import(
    path.join(projectRoot, "src/lib/brands.ts")
  );
  const brand = BRANDS.find((b: { slug: string }) => b.slug === slug);

  if (!brand) {
    console.error(`Brand "${slug}" not found.`);
    console.error(
      "Available brands:",
      BRANDS.map((b: { slug: string }) => b.slug).join(", ")
    );
    process.exit(1);
  }

  // Ensure DB is seeded
  const { getBrandBySlug } = await import(
    path.join(projectRoot, "src/lib/db/queries.ts")
  );
  const dbBrand = getBrandBySlug(slug);
  if (!dbBrand) {
    console.error(
      `Brand "${slug}" not in database. Run: npx tsx src/lib/db/seed.ts`
    );
    process.exit(1);
  }

  const { scanBrand } = await import(
    path.join(projectRoot, "src/lib/scanner/scan-orchestrator.ts")
  );
  const result = await scanBrand(brand);

  console.log(`\n=== Results ===`);
  console.log(`Brand: ${brand.name}`);
  console.log(
    `Score: ${result.report.overallScore}/100 (Grade ${result.report.grade})`
  );
  console.log(`Scan ID: ${result.scanId}`);
  console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
  console.log(`Verdict: ${result.report.verdict}`);
  console.log(`\nCategory Breakdown:`);
  for (const cat of result.report.categories) {
    console.log(`  ${cat.name}: ${cat.score}/100 (${cat.grade})`);
  }
  console.log(`\nFindings: ${result.report.findings.length} issues`);
  for (const f of result.report.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.title}`);
  }
}

main().catch(console.error);

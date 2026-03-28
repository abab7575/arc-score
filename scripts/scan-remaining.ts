/**
 * Scan only brands that don't have a lightweight scan yet.
 * Usage: npx tsx scripts/scan-remaining.ts
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const { runLightweightScan } = await import(path.join(projectRoot, "src/lib/scanner/lightweight-scanner"));
  const { db, schema } = await import(path.join(projectRoot, "src/lib/db/index"));
  const { insertLightweightScan } = await import(path.join(projectRoot, "src/lib/db/queries"));
  const { eq } = await import("drizzle-orm");

  const scannedIds = new Set(
    db.select({ id: schema.lightweightScans.brandId }).from(schema.lightweightScans).all().map((r: { id: number }) => r.id)
  );

  const allBrands = db.select().from(schema.brands).where(eq(schema.brands.active, true)).all();
  const unscanned = allBrands.filter(b => !scannedIds.has(b.id));

  console.log(`${unscanned.length} brands remaining (${scannedIds.size} already scanned)`);

  const concurrency = 8;
  let done = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < unscanned.length; i += concurrency) {
    const batch = unscanned.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (brand) => {
        try {
          const result = await runLightweightScan(brand.url, brand.productUrl ?? undefined);
          insertLightweightScan(brand.id, result);
          done++;
        } catch (e) {
          failed++;
          errors.push(`${brand.slug}: ${e instanceof Error ? e.message : "unknown"}`);
        }
      })
    );

    const total = i + batch.length;
    const pct = Math.round((total / unscanned.length) * 100);
    console.log(`[${total}/${unscanned.length}] ${pct}% — ${done} ok, ${failed} failed`);
  }

  console.log(`\nComplete: ${done} scanned, ${failed} failed`);
  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.slice(0, 20).forEach(e => console.log(`  ${e}`));
  }
}

main().catch(console.error);

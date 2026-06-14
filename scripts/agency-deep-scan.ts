import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: npx tsx scripts/agency-deep-scan.ts <slug>");
  const [{ getBrandBySlug }, { scanBrand }] = await Promise.all([
    import(path.join(projectRoot, "src/lib/db/queries.ts")),
    import(path.join(projectRoot, "src/lib/scanner/scan-orchestrator.ts")),
  ]);
  const brand = getBrandBySlug(slug);
  if (!brand) throw new Error(`Brand "${slug}" not found`);
  const allowed = new Set([
    "fashion", "electronics", "home", "beauty", "grocery", "general", "dtc",
    "luxury", "sports", "health", "pet", "kids", "automotive", "food-beverage",
  ]);
  await scanBrand({
    slug: brand.slug,
    name: brand.name,
    url: brand.url,
    productUrl: brand.productUrl ?? undefined,
    category: (allowed.has(brand.category) ? brand.category : "general") as
      | "fashion" | "electronics" | "home" | "beauty" | "grocery" | "general"
      | "dtc" | "luxury" | "sports" | "health" | "pet" | "kids" | "automotive"
      | "food-beverage",
  }, { force: true, skipVisual: true, skipFeed: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

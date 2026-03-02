/**
 * Brand discovery script — runs brand extraction on recent articles
 * and inserts new brand discoveries into the pipeline.
 *
 * Usage:
 *   npx tsx scripts/brand-discovery.ts [--hours=24]
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const hoursBack = parseInt(
    args.find((a) => a.startsWith("--hours="))?.split("=")[1] ?? "24"
  );

  console.log(`\n=== Brand Discovery ===`);
  console.log(`Looking back: ${hoursBack} hours`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`========================\n`);

  const { runBrandDiscovery } = await import(
    path.join(projectRoot, "src/lib/content/brand-discovery")
  );

  const result = runBrandDiscovery(hoursBack);

  console.log(`Articles processed: ${result.articlesProcessed}`);
  console.log(`New discoveries: ${result.newDiscoveries}`);
  console.log(`Updated mentions: ${result.updatedMentions}`);
  console.log(`\nCompleted: ${new Date().toISOString()}`);
}

main().catch(console.error);

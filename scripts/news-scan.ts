/**
 * News scan script — thin wrapper around the shared runNewsScan().
 *
 * Usage:
 *   npx tsx scripts/news-scan.ts
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Set cwd so the db module resolves the data dir correctly
process.chdir(projectRoot);

async function main() {
  console.log("\n=== ARC Score News Scan ===");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("===========================\n");

  // Dynamic import to ensure cwd is set first
  const { runNewsScan } = await import(
    path.join(projectRoot, "src/lib/news/scan")
  );

  const result = await runNewsScan();

  console.log("\n=== News Scan Complete ===");
  console.log(`Total items checked: ${result.totalItems}`);
  console.log(`New articles added: ${result.newArticles}`);
  console.log(`High relevance (70+): ${result.highRelevance}`);
  console.log(`New brand suggestions: ${result.newSuggestions}`);
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const err of result.errors) {
      console.log(`  ✗ ${err}`);
    }
  }
  console.log(`\nFinished: ${new Date().toISOString()}\n`);
}

main().catch(console.error);

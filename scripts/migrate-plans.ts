/**
 * One-time migration: collapse monitor/team plans to "pro".
 *
 * Usage: npx tsx scripts/migrate-plans.ts
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const { db } = await import(path.join(projectRoot, "src/lib/db/index"));

  // Migrate customers
  const customerResult = db.$client.prepare(
    `UPDATE customers SET plan = 'pro' WHERE plan IN ('monitor', 'team')`
  ).run();
  console.log(`Migrated ${customerResult.changes} customer(s) to 'pro' plan`);

  // Migrate subscriptions
  const subResult = db.$client.prepare(
    `UPDATE subscriptions SET plan = 'pro' WHERE plan IN ('monitor', 'team')`
  ).run();
  console.log(`Migrated ${subResult.changes} subscription(s) to 'pro' plan`);

  console.log("Done.");
}

main().catch(console.error);

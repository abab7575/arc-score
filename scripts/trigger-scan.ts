/**
 * Trigger a production scan from the command line.
 *
 * Usage: npx tsx scripts/trigger-scan.ts
 */

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.BASE_URL || "https://www.arcreport.ai";

async function main() {
  if (!CRON_SECRET) throw new Error("CRON_SECRET is required");
  console.log("Triggering scan...");
  const res = await fetch(`${BASE_URL}/api/cron/lightweight-scan?concurrency=40`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);

import { sqlite } from "../src/lib/db";
import { TRACKED_AGENT_IDS } from "../src/lib/site";

const brands = sqlite.prepare("SELECT id FROM brands WHERE active = 1").all() as Array<{ id: number }>;
const now = new Date().toISOString();
const insert = sqlite.prepare(`
  INSERT INTO lightweight_scans (
    brand_id, robots_txt_found, blocked_agent_count, allowed_agent_count,
    platform, cdn, waf, has_json_ld, has_schema_product, has_open_graph,
    has_sitemap, has_product_feed, has_llms_txt, has_ucp,
    homepage_response_ms, result_json, agent_status_json, scanned_at
  ) VALUES (?, 1, ?, ?, 'shopify', 'cloudflare', 'none', 1, 1, 1, 1, 1, 0, 0, 250, '{}', ?, ?)
`);

sqlite.transaction(() => {
  for (const [index, brand] of brands.entries()) {
    const blocked = index % 4 === 0;
    const status = Object.fromEntries(
      TRACKED_AGENT_IDS.map((agent) => [agent, blocked ? "blocked" : "allowed"]),
    );
    insert.run(
      brand.id,
      blocked ? TRACKED_AGENT_IDS.length : 0,
      blocked ? 0 : TRACKED_AGENT_IDS.length,
      JSON.stringify(status),
      now,
    );
  }
})();

console.log(`Seeded ${brands.length} deterministic lightweight scans for CI.`);

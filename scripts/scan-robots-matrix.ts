/**
 * Scan all active brands' robots.txt for AI agent policies.
 * Stores results in a JSON file for the admin matrix page.
 *
 * Usage: npx tsx scripts/scan-robots-matrix.ts
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFileSync } from "fs";

const AI_AGENTS = [
  { id: "gptbot", name: "GPTBot", company: "OpenAI", product: "ChatGPT Shopping" },
  { id: "chatgpt-user", name: "ChatGPT-User", company: "OpenAI", product: "ChatGPT Browsing" },
  { id: "oai-searchbot", name: "OAI-SearchBot", company: "OpenAI", product: "SearchGPT" },
  { id: "perplexitybot", name: "PerplexityBot", company: "Perplexity", product: "Perplexity Shopping" },
  { id: "claudebot", name: "ClaudeBot", company: "Anthropic", product: "Claude" },
  { id: "google-extended", name: "Google-Extended", company: "Google", product: "Google AI" },
  { id: "amazonbot", name: "Amazonbot", company: "Amazon", product: "Buy For Me" },
  { id: "bingbot", name: "Bingbot", company: "Microsoft", product: "Copilot" },
  { id: "bytespider", name: "Bytespider", company: "ByteDance", product: "TikTok AI" },
  { id: "ccbot", name: "CCBot", company: "Common Crawl", product: "AI Training" },
  { id: "meta-externalagent", name: "meta-externalagent", company: "Meta", product: "Meta AI" },
  { id: "applebot", name: "Applebot", company: "Apple", product: "Siri/Apple Intelligence" },
];

interface BrandResult {
  slug: string;
  name: string;
  url: string;
  category: string;
  robotsTxtFound: boolean;
  robotsTxtUrl: string;
  agents: Record<string, "allowed" | "blocked" | "no_rule">;
  blockedCount: number;
  allowedCount: number;
  totalAgents: number;
  scannedAt: string;
}

function parseRobotsTxt(content: string): Record<string, "allowed" | "blocked" | "no_rule"> {
  const results: Record<string, "allowed" | "blocked" | "no_rule"> = {};
  const lines = content.split("\n").map(l => l.trim());

  for (const agent of AI_AGENTS) {
    // Check if there's a specific rule for this agent
    const agentName = agent.name.toLowerCase();
    let found = false;
    let currentAgent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      if (line.startsWith("user-agent:")) {
        currentAgent = line.replace("user-agent:", "").trim();
      } else if (currentAgent === agentName || currentAgent === agent.name.toLowerCase()) {
        if (line.startsWith("disallow: /") && !line.startsWith("disallow: /admin") && !line.startsWith("disallow: /checkout") && !line.startsWith("disallow: /cart") && !line.startsWith("disallow: /account")) {
          // Disallow: / means block everything
          if (line === "disallow: /" || line === "disallow: /*") {
            results[agent.id] = "blocked";
            found = true;
            break;
          }
        } else if (line.startsWith("allow: /")) {
          results[agent.id] = "allowed";
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Check if the wildcard (*) rule blocks everything
      let inWildcard = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line === "user-agent: *") {
          inWildcard = true;
        } else if (line.startsWith("user-agent:") && line !== "user-agent: *") {
          inWildcard = false;
        } else if (inWildcard && (line === "disallow: /" || line === "disallow: /*")) {
          // Wildcard blocks everything — but this is unusual for main sites
          // Only mark as blocked if there's no Allow: / before it
          results[agent.id] = "blocked";
          found = true;
          break;
        }
      }
    }

    if (!found) {
      results[agent.id] = "no_rule"; // No specific rule = allowed by default
    }
  }

  return results;
}

async function fetchRobotsTxt(url: string): Promise<string | null> {
  try {
    const baseUrl = new URL(url);
    const robotsUrl = `${baseUrl.protocol}//${baseUrl.hostname}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "ARCReport-Scanner/1.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const text = await resp.text();
      // Make sure it's actually a robots.txt and not an HTML error page
      if (text.includes("User-agent") || text.includes("user-agent") || text.includes("Disallow") || text.includes("Allow")) {
        return text;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("Scanning robots.txt for all active brands...\n");

  const allBrands = db
    .select()
    .from(brands)
    .where(eq(brands.active, true))
    .all();

  console.log(`Found ${allBrands.length} active brands\n`);

  const results: BrandResult[] = [];
  const batchSize = 10;

  for (let i = 0; i < allBrands.length; i += batchSize) {
    const batch = allBrands.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (brand) => {
        const content = await fetchRobotsTxt(brand.url);
        const agents = content ? parseRobotsTxt(content) : {};

        // If no robots.txt found, all agents are effectively allowed
        if (!content) {
          for (const agent of AI_AGENTS) {
            agents[agent.id] = "no_rule";
          }
        }

        const blockedCount = Object.values(agents).filter(v => v === "blocked").length;
        const allowedCount = Object.values(agents).filter(v => v === "allowed").length;

        const result: BrandResult = {
          slug: brand.slug,
          name: brand.name,
          url: brand.url,
          category: brand.category || "other",
          robotsTxtFound: !!content,
          robotsTxtUrl: `${new URL(brand.url).protocol}//${new URL(brand.url).hostname}/robots.txt`,
          agents,
          blockedCount,
          allowedCount,
          totalAgents: AI_AGENTS.length,
          scannedAt: new Date().toISOString(),
        };

        const status = blockedCount === 0 ? "✅ OPEN" : blockedCount === AI_AGENTS.length ? "❌ BLOCKED ALL" : `⚠️  ${blockedCount}/${AI_AGENTS.length} blocked`;
        console.log(`  ${brand.name.padEnd(25)} ${status}`);

        return result;
      })
    );
    results.push(...batchResults);
  }

  // Sort by most blocked first
  results.sort((a, b) => b.blockedCount - a.blockedCount);

  const output = {
    generatedAt: new Date().toISOString(),
    totalBrands: results.length,
    agents: AI_AGENTS,
    results,
    summary: {
      allBlocked: results.filter(r => r.blockedCount === AI_AGENTS.length).length,
      someBlocked: results.filter(r => r.blockedCount > 0 && r.blockedCount < AI_AGENTS.length).length,
      noneBlocked: results.filter(r => r.blockedCount === 0).length,
      avgBlockedAgents: (results.reduce((sum, r) => sum + r.blockedCount, 0) / results.length).toFixed(1),
    },
  };

  writeFileSync("data/robots-matrix.json", JSON.stringify(output, null, 2));
  console.log(`\n${"=".repeat(50)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(50)}`);
  console.log(`Total brands scanned: ${output.totalBrands}`);
  console.log(`Block ALL AI agents:  ${output.summary.allBlocked}`);
  console.log(`Block SOME agents:    ${output.summary.someBlocked}`);
  console.log(`Block NONE:           ${output.summary.noneBlocked}`);
  console.log(`Avg agents blocked:   ${output.summary.avgBlockedAgents} / ${AI_AGENTS.length}`);
  console.log(`\nResults saved to data/robots-matrix.json`);
}

main().catch(console.error);

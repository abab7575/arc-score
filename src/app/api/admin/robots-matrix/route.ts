import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
  { id: "applebot", name: "Applebot", company: "Apple", product: "Apple Intelligence" },
];

function parseRobotsTxt(content: string): Record<string, "allowed" | "blocked" | "no_rule"> {
  const results: Record<string, "allowed" | "blocked" | "no_rule"> = {};
  const lines = content.split("\n").map(l => l.trim());

  for (const agent of AI_AGENTS) {
    const agentName = agent.name.toLowerCase();
    let found = false;
    let currentAgent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.startsWith("user-agent:")) {
        currentAgent = line.replace("user-agent:", "").trim();
      } else if (currentAgent === agentName) {
        if (line === "disallow: /" || line === "disallow: /*") {
          results[agent.id] = "blocked";
          found = true;
          break;
        } else if (line.startsWith("allow: /")) {
          results[agent.id] = "allowed";
          found = true;
          break;
        }
      }
    }

    if (!found) {
      let inWildcard = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line === "user-agent: *") {
          inWildcard = true;
        } else if (line.startsWith("user-agent:")) {
          inWildcard = false;
        } else if (inWildcard && (line === "disallow: /" || line === "disallow: /*")) {
          results[agent.id] = "blocked";
          found = true;
          break;
        }
      }
    }

    if (!found) {
      results[agent.id] = "no_rule";
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
      if (text.includes("User-agent") || text.includes("user-agent") || text.includes("Disallow") || text.includes("Allow")) {
        return text;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function generateMatrix() {
  const allBrands = db.select().from(brands).where(eq(brands.active, true)).all();
  const results: Array<{
    slug: string; name: string; url: string; category: string;
    robotsTxtFound: boolean; robotsTxtUrl: string;
    agents: Record<string, "allowed" | "blocked" | "no_rule">;
    blockedCount: number; allowedCount: number; totalAgents: number;
    scannedAt: string;
  }> = [];

  const batchSize = 15;
  for (let i = 0; i < allBrands.length; i += batchSize) {
    const batch = allBrands.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (brand) => {
        const content = await fetchRobotsTxt(brand.url);
        const agents = content ? parseRobotsTxt(content) : {};
        if (!content) {
          for (const agent of AI_AGENTS) agents[agent.id] = "no_rule";
        }
        const blockedCount = Object.values(agents).filter(v => v === "blocked").length;
        const allowedCount = Object.values(agents).filter(v => v === "allowed").length;
        return {
          slug: brand.slug, name: brand.name, url: brand.url,
          category: brand.category || "other",
          robotsTxtFound: !!content,
          robotsTxtUrl: `${new URL(brand.url).protocol}//${new URL(brand.url).hostname}/robots.txt`,
          agents, blockedCount, allowedCount, totalAgents: AI_AGENTS.length,
          scannedAt: new Date().toISOString(),
        };
      })
    );
    results.push(...batchResults);
  }

  results.sort((a, b) => b.blockedCount - a.blockedCount || a.name.localeCompare(b.name));

  return {
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
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "true";

  const filePath = join(process.cwd(), "data", "robots-matrix.json");

  // Return cached file if it exists and refresh not requested
  if (!refresh && existsSync(filePath)) {
    try {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    } catch {
      // Fall through to regenerate
    }
  }

  // Generate fresh data
  try {
    const data = await generateMatrix();
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch {
      // Can't write file (read-only filesystem) — that's ok, just return the data
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to generate matrix: ${e instanceof Error ? e.message : "unknown error"}` },
      { status: 500 }
    );
  }
}

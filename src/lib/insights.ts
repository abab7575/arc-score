/**
 * Headline statistics auto-computed from the latest scan of every brand.
 * Shared by /insights (C3), markdown variants (B3), and the MCP server (B4).
 */

import { getMatrixData, getWeeklyTotals, getPreviousWeekTotals } from "@/lib/db/queries";
import { TRACKED_AGENTS } from "@/lib/site";

export interface AgentStat {
  agent: string;
  company: string;
  blockedCount: number;     // policy blocks (robots.txt)
  restrictedCount: number;  // WAF/CDN blocks
  blockedPercent: number;   // blocked+restricted / scanned
}

export interface CategoryStat {
  category: string;
  brandCount: number;
  fullyOpenCount: number;
  fullyOpenPercent: number;
  avgBlockedAgents: number;
}

export interface PlatformStat {
  platform: string;
  brandCount: number;
  percent: number;
}

export interface Insights {
  generatedAt: string;
  lastScanAt: string | null;
  scannedBrands: number;
  fullyOpenCount: number;
  fullyOpenPercent: number;
  blockingAnyCount: number;
  llmsTxtCount: number;
  llmsTxtPercent: number;
  agentStats: AgentStat[];
  mostBlockedAgent: AgentStat | null;
  categoryStats: CategoryStat[];
  mostOpenCategory: CategoryStat | null;
  platformStats: PlatformStat[];
  changesThisWeek: number;
  changesPreviousWeek: number;
  brandsMovingThisWeek: number;
}

export function computeInsights(): Insights {
  const data = getMatrixData().filter((d) => d.scan !== null);
  const scanned = data.length;

  const agentCounters = new Map<string, { blocked: number; restricted: number }>();
  for (const a of TRACKED_AGENTS) agentCounters.set(a.id, { blocked: 0, restricted: 0 });

  const categoryMap = new Map<string, { total: number; fullyOpen: number; blockedSum: number }>();
  const platformMap = new Map<string, number>();
  let fullyOpenCount = 0;
  let blockingAnyCount = 0;
  let llmsTxtCount = 0;
  let lastScanAt: string | null = null;

  for (const { brand, scan } of data) {
    if (!scan) continue;
    let status: Record<string, string> = {};
    try {
      status = JSON.parse(scan.agentStatusJson);
    } catch {
      status = {};
    }

    let brandBlocked = 0;
    for (const a of TRACKED_AGENTS) {
      const s = status[a.id];
      const c = agentCounters.get(a.id)!;
      if (s === "blocked") { c.blocked += 1; brandBlocked += 1; }
      else if (s === "restricted") { c.restricted += 1; brandBlocked += 1; }
    }

    if (brandBlocked === 0) fullyOpenCount += 1;
    else blockingAnyCount += 1;
    if (scan.hasLlmsTxt) llmsTxtCount += 1;
    if (!lastScanAt || scan.scannedAt > lastScanAt) lastScanAt = scan.scannedAt;

    const cat = categoryMap.get(brand.category) ?? { total: 0, fullyOpen: 0, blockedSum: 0 };
    cat.total += 1;
    cat.blockedSum += brandBlocked;
    if (brandBlocked === 0) cat.fullyOpen += 1;
    categoryMap.set(brand.category, cat);

    const platform = scan.platform && scan.platform !== "unknown" ? scan.platform : "unknown";
    platformMap.set(platform, (platformMap.get(platform) ?? 0) + 1);
  }

  const agentStats: AgentStat[] = TRACKED_AGENTS.map((a) => {
    const c = agentCounters.get(a.id)!;
    return {
      agent: a.id,
      company: a.company,
      blockedCount: c.blocked,
      restrictedCount: c.restricted,
      blockedPercent: scanned > 0 ? Math.round(((c.blocked + c.restricted) / scanned) * 1000) / 10 : 0,
    };
  });

  const categoryStats: CategoryStat[] = [...categoryMap.entries()]
    .map(([category, c]) => ({
      category,
      brandCount: c.total,
      fullyOpenCount: c.fullyOpen,
      fullyOpenPercent: c.total > 0 ? Math.round((c.fullyOpen / c.total) * 1000) / 10 : 0,
      avgBlockedAgents: c.total > 0 ? Math.round((c.blockedSum / c.total) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.brandCount - a.brandCount);

  const platformStats: PlatformStat[] = [...platformMap.entries()]
    .map(([platform, count]) => ({
      platform,
      brandCount: count,
      percent: scanned > 0 ? Math.round((count / scanned) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.brandCount - a.brandCount);

  const weekly = getWeeklyTotals(7);
  const prevWeekly = getPreviousWeekTotals(7);

  // Most-open category among categories with a meaningful sample
  const eligibleCats = categoryStats.filter((c) => c.brandCount >= 10);
  const mostOpenCategory = (eligibleCats.length > 0 ? eligibleCats : categoryStats)
    .slice()
    .sort((a, b) => b.fullyOpenPercent - a.fullyOpenPercent)[0] ?? null;

  return {
    generatedAt: new Date().toISOString(),
    lastScanAt,
    scannedBrands: scanned,
    fullyOpenCount,
    fullyOpenPercent: scanned > 0 ? Math.round((fullyOpenCount / scanned) * 1000) / 10 : 0,
    blockingAnyCount,
    llmsTxtCount,
    llmsTxtPercent: scanned > 0 ? Math.round((llmsTxtCount / scanned) * 1000) / 10 : 0,
    agentStats,
    mostBlockedAgent: agentStats.slice().sort((a, b) => b.blockedPercent - a.blockedPercent)[0] ?? null,
    categoryStats,
    mostOpenCategory,
    platformStats,
    changesThisWeek: weekly.totalChanges,
    changesPreviousWeek: prevWeekly.totalChanges,
    brandsMovingThisWeek: weekly.brandsMoving,
  };
}

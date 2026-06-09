/**
 * ARC Score v1.0 — a 0–100 agent-access score per brand, computed
 * deterministically from the latest lightweight scan.
 *
 * Components (documented on /methodology — do not change without bumping
 * SCORE_VERSION in @/lib/site and adding a methodology changelog entry):
 *
 *   Agent access breadth — 50 pts
 *     Mean per-agent access across the 9 tracked agents:
 *     allowed / no_rule = 1.0, inconclusive = 0.5, restricted = 0.25, blocked = 0.
 *   Structured data quality — 25 pts
 *     JSON-LD 7, Schema.org Product 7, Open Graph 4, sitemap 4, product feed 3.
 *   Protocol files — 15 pts
 *     llms.txt present 6 (+3 if it links out), agents.txt 3, UCP 3.
 *   Scan stability — 10 pts
 *     Share of the 9 per-agent checks that returned a conclusive verdict
 *     in the latest scan (timeouts / errors reduce confidence, not access).
 */

import { TRACKED_AGENT_IDS } from "@/lib/site";

export interface ScanLike {
  agentStatusJson: string;
  hasJsonLd: boolean;
  hasSchemaProduct: boolean;
  hasOpenGraph: boolean;
  hasSitemap: boolean;
  hasProductFeed: boolean;
  hasLlmsTxt: boolean;
  llmsTxtLinkCount?: number | null;
  hasAgentsTxt: boolean;
  hasUcp: boolean;
}

export interface ArcScore {
  total: number;
  agentAccess: number;     // 0–50
  structuredData: number;  // 0–25
  protocolFiles: number;   // 0–15
  scanStability: number;   // 0–10
}

const ACCESS_WEIGHT: Record<string, number> = {
  allowed: 1,
  no_rule: 1,
  inconclusive: 0.5,
  restricted: 0.25,
  blocked: 0,
};

export function computeArcScore(scan: ScanLike): ArcScore {
  let agentStatus: Record<string, string> = {};
  try {
    agentStatus = JSON.parse(scan.agentStatusJson) as Record<string, string>;
  } catch {
    agentStatus = {};
  }

  let accessSum = 0;
  let conclusive = 0;
  for (const agent of TRACKED_AGENT_IDS) {
    const status = agentStatus[agent] ?? "inconclusive";
    accessSum += ACCESS_WEIGHT[status] ?? 0.5;
    if (status !== "inconclusive") conclusive += 1;
  }
  const n = TRACKED_AGENT_IDS.length;
  const agentAccess = round1((accessSum / n) * 50);

  const structuredData =
    (scan.hasJsonLd ? 7 : 0) +
    (scan.hasSchemaProduct ? 7 : 0) +
    (scan.hasOpenGraph ? 4 : 0) +
    (scan.hasSitemap ? 4 : 0) +
    (scan.hasProductFeed ? 3 : 0);

  const protocolFiles =
    (scan.hasLlmsTxt ? 6 : 0) +
    (scan.hasLlmsTxt && (scan.llmsTxtLinkCount ?? 0) > 0 ? 3 : 0) +
    (scan.hasAgentsTxt ? 3 : 0) +
    (scan.hasUcp ? 3 : 0);

  const scanStability = round1((conclusive / n) * 10);

  return {
    total: Math.round(agentAccess + structuredData + protocolFiles + scanStability),
    agentAccess,
    structuredData,
    protocolFiles,
    scanStability,
  };
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function arcScoreLabel(total: number): { label: string; color: string } {
  if (total >= 85) return { label: "Open", color: "#059669" };
  if (total >= 65) return { label: "Mostly open", color: "#0259DD" };
  if (total >= 40) return { label: "Mixed", color: "#D97706" };
  return { label: "Restricted", color: "#DC2626" };
}

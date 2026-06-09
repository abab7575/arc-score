import { describe, it, expect } from "vitest";
import { computeArcScore, arcScoreLabel } from "@/lib/scoring/arc-score";
import { TRACKED_AGENT_IDS } from "@/lib/site";

function scanWith(overrides: Partial<Parameters<typeof computeArcScore>[0]> = {}, statuses?: Record<string, string>) {
  const allOpen = Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "allowed"]));
  return {
    agentStatusJson: JSON.stringify(statuses ?? allOpen),
    hasJsonLd: false,
    hasSchemaProduct: false,
    hasOpenGraph: false,
    hasSitemap: false,
    hasProductFeed: false,
    hasLlmsTxt: false,
    llmsTxtLinkCount: null,
    hasAgentsTxt: false,
    hasUcp: false,
    ...overrides,
  };
}

describe("ARC Score v1.0", () => {
  it("scores a fully open brand with every signal at 100", () => {
    const score = computeArcScore(
      scanWith({
        hasJsonLd: true,
        hasSchemaProduct: true,
        hasOpenGraph: true,
        hasSitemap: true,
        hasProductFeed: true,
        hasLlmsTxt: true,
        llmsTxtLinkCount: 12,
        hasAgentsTxt: true,
        hasUcp: true,
      }),
    );
    expect(score.total).toBe(100);
    expect(score.agentAccess).toBe(50);
    expect(score.structuredData).toBe(25);
    expect(score.protocolFiles).toBe(15);
    expect(score.scanStability).toBe(10);
  });

  it("scores a fully blocked brand with no signals at 10 (stability only)", () => {
    const allBlocked = Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "blocked"]));
    const score = computeArcScore(scanWith({}, allBlocked));
    expect(score.agentAccess).toBe(0);
    expect(score.scanStability).toBe(10); // conclusive verdicts, just negative
    expect(score.total).toBe(10);
  });

  it("weights restricted (0.25) above blocked (0) and below open (1)", () => {
    const blocked = computeArcScore(scanWith({}, Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "blocked"]))));
    const restricted = computeArcScore(scanWith({}, Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "restricted"]))));
    const open = computeArcScore(scanWith({}, Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "no_rule"]))));
    expect(blocked.agentAccess).toBeLessThan(restricted.agentAccess);
    expect(restricted.agentAccess).toBeLessThan(open.agentAccess);
    expect(restricted.agentAccess).toBe(12.5); // 0.25 * 50
  });

  it("reduces stability for inconclusive verdicts without counting them as blocks", () => {
    const statuses = Object.fromEntries(TRACKED_AGENT_IDS.map((a) => [a, "allowed"]));
    statuses[TRACKED_AGENT_IDS[0]] = "inconclusive";
    const score = computeArcScore(scanWith({}, statuses));
    expect(score.scanStability).toBeLessThan(10);
    expect(score.agentAccess).toBeGreaterThan(44); // 8*1 + 0.5 of 9 → ~47.2
  });

  it("only grants llms.txt link bonus when links exist", () => {
    const without = computeArcScore(scanWith({ hasLlmsTxt: true, llmsTxtLinkCount: 0 }));
    const withLinks = computeArcScore(scanWith({ hasLlmsTxt: true, llmsTxtLinkCount: 5 }));
    expect(without.protocolFiles).toBe(6);
    expect(withLinks.protocolFiles).toBe(9);
  });

  it("handles malformed agent status JSON without throwing", () => {
    const score = computeArcScore(scanWith({ agentStatusJson: "not json" }));
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.agentAccess).toBe(25); // all default to inconclusive = 0.5
  });

  it("labels score bands", () => {
    expect(arcScoreLabel(90).label).toBe("Open");
    expect(arcScoreLabel(70).label).toBe("Mostly open");
    expect(arcScoreLabel(50).label).toBe("Mixed");
    expect(arcScoreLabel(10).label).toBe("Restricted");
  });
});

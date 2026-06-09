/**
 * Integration tests for the MCP server (B4). Each tool is exercised through
 * the full JSON-RPC handler against the real local SQLite dataset.
 */

import { describe, it, expect } from "vitest";
import { handleMcpBody, handleMcpMessage, SERVER_INFO } from "@/lib/mcp/server";
import { TRACKED_AGENT_IDS } from "@/lib/site";

let nextId = 1;

function rpc(method: string, params?: Record<string, unknown>) {
  const res = handleMcpMessage({ jsonrpc: "2.0", id: nextId++, method, params });
  expect(res).not.toBeNull();
  return res as Extract<NonNullable<typeof res>, { result: unknown }> & {
    result?: any;
    error?: any;
  };
}

function callTool(name: string, args: Record<string, unknown>) {
  const res = rpc("tools/call", { name, arguments: args });
  expect(res.error).toBeUndefined();
  const result = res.result as {
    content: Array<{ type: string; text: string }>;
    structuredContent?: unknown;
    isError: boolean;
  };
  return result;
}

function toolJson(name: string, args: Record<string, unknown>) {
  const result = callTool(name, args);
  expect(result.isError).toBe(false);
  return JSON.parse(result.content[0].text);
}

describe("protocol lifecycle", () => {
  it("initializes with server info and capabilities", () => {
    const res = rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0.0.0" },
    });
    expect(res.result.protocolVersion).toBe("2025-06-18");
    expect(res.result.serverInfo.name).toBe(SERVER_INFO.name);
    expect(res.result.capabilities.tools).toBeDefined();
    expect(res.result.capabilities.resources).toBeDefined();
  });

  it("falls back to a supported protocol version", () => {
    const res = rpc("initialize", { protocolVersion: "1999-01-01" });
    expect(["2025-06-18", "2025-03-26", "2024-11-05"]).toContain(res.result.protocolVersion);
  });

  it("treats notifications/initialized as a notification (no response)", () => {
    const res = handleMcpBody({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res).toBeNull();
  });

  it("answers ping", () => {
    expect(rpc("ping").result).toEqual({});
  });

  it("lists all five tools", () => {
    const res = rpc("tools/list");
    const names = res.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([
      "get_brand_status",
      "search_brands",
      "get_recent_changes",
      "get_agent_stats",
      "compare_brands",
    ]);
    for (const tool of res.result.tools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("rejects unknown methods with -32601", () => {
    const res = rpc("definitely/not-a-method");
    expect(res.error.code).toBe(-32601);
  });

  it("rejects non-JSON-RPC bodies with -32700", () => {
    const res = handleMcpBody({ hello: "world" });
    expect((res as any).error.code).toBe(-32700);
  });
});

describe("get_brand_status", () => {
  it("returns full status for a known brand by domain", () => {
    const data = toolJson("get_brand_status", { domain: "nike.com" });
    expect(data.found).toBe(true);
    expect(data.brand.slug).toBe("nike");
    for (const agent of TRACKED_AGENT_IDS) {
      expect(data.agent_access[agent]).toBeDefined();
    }
    expect(data.arc_score).toBeGreaterThanOrEqual(0);
    expect(data.arc_score).toBeLessThanOrEqual(100);
    expect(data.arc_score_components.agent_access.max).toBe(50);
    expect(data.structured_data).toHaveProperty("json_ld");
    expect(data.llms_txt).toHaveProperty("present");
    expect(data.last_scanned).toBeTruthy();
    expect(data.source_url).toContain("/brand/nike");
    expect(data.last_updated).toBe(data.last_scanned);
  });

  it("resolves slugs and full URLs", () => {
    expect(toolJson("get_brand_status", { domain: "nike" }).brand.slug).toBe("nike");
    expect(toolJson("get_brand_status", { domain: "https://www.nike.com/gb" }).brand.slug).toBe("nike");
  });

  it("suggests nearest matches for unknown domains", () => {
    const data = toolJson("get_brand_status", { domain: "nikee.com" });
    expect(data.found).toBe(false);
    expect(data.did_you_mean.length).toBeGreaterThan(0);
    expect(data.did_you_mean.join(",")).toContain("nike");
  });

  it("flags missing domain as a tool input error", () => {
    const result = callTool("get_brand_status", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("domain is required");
  });
});

describe("search_brands", () => {
  it("filters by category and paginates", () => {
    const page1 = toolJson("search_brands", { category: "fashion", limit: 5, offset: 0 });
    expect(page1.returned).toBeLessThanOrEqual(5);
    expect(page1.total).toBeGreaterThan(5);
    expect(page1.brands.every((b: any) => b.category === "fashion")).toBe(true);
    const page2 = toolJson("search_brands", { category: "fashion", limit: 5, offset: 5 });
    expect(page2.brands[0]?.slug).not.toBe(page1.brands[0]?.slug);
    expect(page1.source_url).toContain("/matrix");
    expect(page1.last_updated).toBeTruthy();
  });

  it("filters by blocking_agent with real statuses", () => {
    const data = toolJson("search_brands", { blocking_agent: "GPTBot", limit: 10 });
    for (const b of data.brands) {
      expect(["blocked", "restricted"]).toContain(b.agent_access.GPTBot);
    }
  });

  it("filters by allowing_agent", () => {
    const data = toolJson("search_brands", { allowing_agent: "ClaudeBot", limit: 10 });
    for (const b of data.brands) {
      expect(["allowed", "no_rule"]).toContain(b.agent_access.ClaudeBot);
    }
  });

  it("rejects unknown agents", () => {
    const result = callTool("search_brands", { blocking_agent: "NotARealBot" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NotARealBot");
  });
});

describe("get_recent_changes", () => {
  it("returns confirmed changes with before/after and clamps days", () => {
    const data = toolJson("get_recent_changes", { days: 365 });
    expect(data.days).toBe(90); // clamped
    for (const c of data.changes.slice(0, 5)) {
      expect(c).toHaveProperty("before");
      expect(c).toHaveProperty("after");
      expect(c.brand_url).toContain("/brand/");
    }
    expect(data.source_url).toContain("/changelog");
  });

  it("filters by category", () => {
    const all = toolJson("get_recent_changes", { days: 90 });
    const fashion = toolJson("get_recent_changes", { days: 90, category: "fashion" });
    expect(fashion.total).toBeLessThanOrEqual(all.total);
  });
});

describe("get_agent_stats", () => {
  it("covers all 9 agents with blocking percentages", () => {
    const data = toolJson("get_agent_stats", {});
    expect(data.agents).toHaveLength(TRACKED_AGENT_IDS.length);
    for (const a of data.agents) {
      expect(a.percent_of_index_blocking).toBeGreaterThanOrEqual(0);
      expect(a.percent_of_index_blocking).toBeLessThanOrEqual(100);
    }
    expect(data.most_blocked_agent).toBeTruthy();
    expect(data.by_category.length).toBeGreaterThan(0);
    expect(data.week_over_week).toHaveProperty("delta");
    expect(data.source_url).toContain("/insights");
  });

  it("narrows to a single agent", () => {
    const data = toolJson("get_agent_stats", { agent: "GPTBot" });
    expect(data.agents).toHaveLength(1);
    expect(data.agents[0].agent).toBe("GPTBot");
  });

  it("rejects unknown agents", () => {
    const result = callTool("get_agent_stats", { agent: "FooBot" });
    expect(result.isError).toBe(true);
  });
});

describe("compare_brands", () => {
  it("compares multiple brands side by side", () => {
    const data = toolJson("compare_brands", { domains: ["nike.com", "adidas", "zara"] });
    expect(data.compared.length).toBe(3);
    for (const c of data.compared) {
      expect(c.arc_score).toBeGreaterThanOrEqual(0);
      for (const agent of TRACKED_AGENT_IDS) {
        expect(c.agent_access[agent]).toBeDefined();
      }
    }
    expect(data.agents).toEqual([...TRACKED_AGENT_IDS]);
    expect(data.last_updated).toBeTruthy();
  });

  it("reports unknown domains with suggestions while comparing the rest", () => {
    const data = toolJson("compare_brands", { domains: ["nike", "not-a-real-brand-xyz.com"] });
    expect(data.compared.length).toBe(1);
    expect(data.not_found.length).toBe(1);
    expect(data.not_found[0].did_you_mean.length).toBeGreaterThan(0);
  });

  it("rejects more than 10 domains", () => {
    const domains = Array.from({ length: 11 }, (_, i) => `brand${i}.com`);
    const result = callTool("compare_brands", { domains });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("at most 10");
  });

  it("rejects an empty domain list", () => {
    const result = callTool("compare_brands", { domains: [] });
    expect(result.isError).toBe(true);
  });
});

describe("resources", () => {
  it("lists methodology and insights resources", () => {
    const res = rpc("resources/list");
    const uris = res.result.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain("arc://methodology");
    expect(uris).toContain("arc://insights/latest");
  });

  it("reads the methodology resource as markdown", () => {
    const res = rpc("resources/read", { uri: "arc://methodology" });
    const text = res.result.contents[0].text;
    expect(text).toContain("Methodology");
    expect(text).toContain("ARC Score");
    expect(text).toContain("two consecutive scans");
  });

  it("reads the latest insights resource", () => {
    const res = rpc("resources/read", { uri: "arc://insights/latest" });
    expect(res.result.contents[0].text).toContain("Insights");
  });

  it("errors cleanly on unknown resources", () => {
    const res = rpc("resources/read", { uri: "arc://nope" });
    expect(res.error.code).toBe(-32002);
  });
});

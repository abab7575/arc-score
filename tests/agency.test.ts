import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken, normalizeDomain } from "@/lib/agency/core";
import { handleAgencyMcp } from "@/lib/agency/mcp";
import { createUnsubscribeToken, readUnsubscribeToken } from "@/lib/agency/email";
import { assertPublicUrl } from "@/lib/security/network";

describe("agency security helpers", () => {
  it("normalizes domains without paths or schemes", () => {
    expect(normalizeDomain("https://www.Example.com/work?x=1")).toBe("example.com");
  });

  it("creates high-entropy tokens and stores stable hashes", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(30);
    expect(hashToken(first)).toHaveLength(64);
    expect(hashToken(first)).toBe(hashToken(first));
  });

  it("signs unsubscribe addresses instead of exposing raw emails", () => {
    const previous = process.env.CUSTOMER_SESSION_SECRET;
    process.env.CUSTOMER_SESSION_SECRET = "test-secret-with-at-least-thirty-two-characters";
    const token = createUnsubscribeToken("Agency@Example.com");
    expect(token).not.toContain("Agency@Example.com");
    expect(readUnsubscribeToken(token)).toBe("agency@example.com");
    expect(readUnsubscribeToken(`${token}tampered`)).toBeNull();
    process.env.CUSTOMER_SESSION_SECRET = previous;
  });

  it("rejects scanner access to local and private destinations", async () => {
    await expect(assertPublicUrl("http://localhost")).rejects.toThrow();
    await expect(assertPublicUrl("http://127.0.0.1")).rejects.toThrow();
    await expect(assertPublicUrl("http://169.254.169.254")).rejects.toThrow();
  });
});

describe("agency MCP protocol", () => {
  it("initializes as a private agency MCP server", () => {
    const response = handleAgencyMcp({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    }, 999999) as { result: { serverInfo: { name: string } } };
    expect(response.result.serverInfo.name).toBe("arc-agency");
  });

  it("publishes portfolio tools without reading a workspace", () => {
    const response = handleAgencyMcp({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    }, 999999) as { result: { tools: Array<{ name: string }> } };
    expect(response.result.tools.map((tool) => tool.name)).toEqual([
      "get_portfolio_health",
      "list_portfolio_sites",
      "get_site_report",
      "get_recent_regressions",
    ]);
  });
});

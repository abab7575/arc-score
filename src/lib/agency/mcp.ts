import { getWorkspaceReadout } from "./core";

interface RpcRequest { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> }

const tools = [
  {
    name: "get_portfolio_health",
    description: "Summary of the authenticated agency portfolio: scores, issue counts, stale scans, and highest-priority sites.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_portfolio_sites",
    description: "List monitored client and prospect storefronts with ARC Score and current findings.",
    inputSchema: { type: "object", properties: { relationship: { type: "string", enum: ["client", "prospect"] } } },
  },
  {
    name: "get_site_report",
    description: "Detailed evidence and implementation-ready fixes for one monitored storefront.",
    inputSchema: { type: "object", properties: { domain: { type: "string" } }, required: ["domain"] },
  },
  {
    name: "get_recent_regressions",
    description: "Confirmed changes detected across the portfolio in the last 30 days.",
    inputSchema: { type: "object", properties: { days: { type: "number", minimum: 1, maximum: 30 } } },
  },
] as const;

function result(id: RpcRequest["id"], value: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result: value };
}

function error(id: RpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export function handleAgencyMcp(body: unknown, workspaceId: number) {
  const msg = body as RpcRequest;
  if (!msg || msg.jsonrpc !== "2.0") return error(null, -32700, "Expected JSON-RPC 2.0");
  if (msg.method === "initialize") return result(msg.id, {
    protocolVersion: String(msg.params?.protocolVersion || "2025-06-18"),
    capabilities: { tools: {} },
    serverInfo: { name: "arc-agency", title: "Arc for Agencies", version: "1.0.0" },
    instructions: "Private AI-commerce portfolio intelligence for the authenticated agency workspace.",
  });
  if (msg.method === "ping") return result(msg.id, {});
  if (msg.method === "notifications/initialized") return null;
  if (msg.method === "tools/list") return result(msg.id, { tools });
  if (msg.method === "prompts/list") return result(msg.id, { prompts: [] });
  if (msg.method !== "tools/call") return error(msg.id, -32601, `Method not found: ${msg.method}`);
  const data = getWorkspaceReadout(workspaceId);
  if (!data) return error(msg.id, -32004, "Workspace not found");
  const name = String(msg.params?.name || "");
  const args = (msg.params?.arguments || {}) as Record<string, unknown>;
  let output: unknown;
  if (name === "get_portfolio_health") {
    output = {
      agency: data.workspace.name,
      monitored_sites: data.sites.length,
      average_arc_score: data.averageScore,
      open_issues: data.issueCount,
      stale_scans: data.staleCount,
      priority_sites: [...data.sites].sort((a, b) => b.issues.length - a.issues.length).slice(0, 5)
        .map((item) => ({ domain: item.site.domain, score: item.score?.total ?? null, issues: item.issues })),
    };
  } else if (name === "list_portfolio_sites") {
    output = data.sites
      .filter((item) => !args.relationship || item.site.relationship === args.relationship)
      .map((item) => ({ domain: item.site.domain, relationship: item.site.relationship, score: item.score?.total ?? null, issues: item.issues, scanned_at: item.scan?.scannedAt ?? null }));
  } else if (name === "get_site_report") {
    const domain = String(args.domain || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    const item = data.sites.find((entry) => entry.site.domain === domain);
    if (!item) return error(msg.id, -32602, "Domain is not in this workspace");
    output = {
      domain,
      score: item.score,
      issues: item.issues,
      fixes: item.fixes.map((fix) => ({ title: fix.title, prompt: fix.prompt })),
      scan: item.scan ? { scanned_at: item.scan.scannedAt, platform: item.scan.platform, waf: item.scan.waf } : null,
    };
  } else if (name === "get_recent_regressions") {
    const days = Math.max(1, Math.min(30, Number(args.days || 7)));
    const cutoff = Date.now() - days * 86400000;
    output = data.sites.flatMap((item) => (item.history ?? [])
      .filter((change) => new Date(change.detectedAt).getTime() >= cutoff)
      .map((change) => ({ domain: item.site.domain, field: change.field, old_value: change.oldValue, new_value: change.newValue, detected_at: change.detectedAt })));
  } else {
    return error(msg.id, -32602, `Unknown tool: ${name}`);
  }
  return result(msg.id, {
    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
    isError: false,
  });
}

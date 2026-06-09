/**
 * Minimal stateless MCP server (Streamable HTTP transport, JSON responses).
 * Implements the subset every read-only MCP client needs: initialize, ping,
 * tools/list, tools/call, resources/list, resources/read, prompts/list.
 *
 * Hand-rolled instead of @modelcontextprotocol/sdk because the SDK's HTTP
 * transport expects Node req/res streams, not App Router Request/Response.
 * Wire format follows the MCP spec (JSON-RPC 2.0 over POST).
 */

import {
  getBrandStatus,
  searchBrands,
  getRecentChanges,
  getAgentStats,
  compareBrands,
  ToolInputError,
} from "./tools";
import { methodologyMarkdown, insightsMarkdown } from "@/lib/markdown-pages";
import { TRACKED_AGENT_IDS, SITE_URL } from "@/lib/site";

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";

export const SERVER_INFO = {
  name: "arc-report",
  title: "ARC Report — AI agent access in e-commerce",
  version: "1.0.0",
};

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number | string | null; result: unknown }
  | { jsonrpc: "2.0"; id: number | string | null; error: { code: number; message: string; data?: unknown } };

const TOOLS = [
  {
    name: "get_brand_status",
    description:
      "Current AI-agent access for one brand: per-agent status for all 9 tracked agents (GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Amazonbot, Bingbot, CCBot), platform, structured data quality, llms.txt presence, ARC Score with component breakdown, and last-scanned time. Unknown domains return nearest-match suggestions.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: 'Brand domain, slug, or name — e.g. "nike.com", "nike", or "Nike".',
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "search_brands",
    description:
      "Search and filter the brand index. Filter by free-text query, category, e-commerce platform, or which agent a brand blocks/allows. Paginated.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text match on brand name, slug, or URL." },
        category: { type: "string", description: 'Category, e.g. "fashion", "electronics", "beauty".' },
        platform: { type: "string", description: 'Platform, e.g. "shopify", "magento", "custom".' },
        blocking_agent: {
          type: "string",
          enum: [...TRACKED_AGENT_IDS],
          description: "Only brands that block or restrict this agent.",
        },
        allowing_agent: {
          type: "string",
          enum: [...TRACKED_AGENT_IDS],
          description: "Only brands that allow this agent (explicitly or by default).",
        },
        limit: { type: "number", description: "Page size, 1–100 (default 25)." },
        offset: { type: "number", description: "Pagination offset (default 0)." },
      },
    },
  },
  {
    name: "get_recent_changes",
    description:
      "Confirmed agent-access changes across the index with before/after values. robots.txt diffs publish immediately; inferred signals require two consecutive scans.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days, 1–90 (default 7)." },
        category: { type: "string", description: "Restrict to one brand category." },
      },
    },
  },
  {
    name: "get_agent_stats",
    description:
      "Index-level statistics: % of brands blocking each AI agent (policy vs WAF), per-category blocking rates, and week-over-week change counts. Pass `agent` for a single agent's breakdown.",
    inputSchema: {
      type: "object",
      properties: {
        agent: {
          type: "string",
          enum: [...TRACKED_AGENT_IDS],
          description: "Optional: one tracked agent.",
        },
      },
    },
  },
  {
    name: "compare_brands",
    description:
      "Side-by-side agent-access matrix for 2–10 brands: per-agent status, platform, structured data signals, llms.txt, and ARC Scores.",
    inputSchema: {
      type: "object",
      properties: {
        domains: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 10,
          description: 'Brand domains or slugs, e.g. ["nike.com", "adidas", "zara"].',
        },
      },
      required: ["domains"],
    },
  },
] as const;

const RESOURCES = [
  {
    uri: "arc://methodology",
    name: "methodology",
    title: "Scan methodology & ARC Score v1.0 formula",
    description:
      "How ARC Report scans work: the 9 tracked agents, robots.txt parsing, live HTTP tests, the two-scan confirmation rule, the ARC Score formula, and known limitations.",
    mimeType: "text/markdown",
  },
  {
    uri: "arc://insights/latest",
    name: "latest-insights",
    title: "Latest insights from the most recent scan",
    description:
      "Auto-computed headline statistics: blocking rate per agent, category openness, platform breakdown, week-over-week change counts.",
    mimeType: "text/markdown",
  },
] as const;

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => unknown> = {
  get_brand_status: (a) => getBrandStatus(a as { domain?: string }),
  search_brands: (a) => searchBrands(a),
  get_recent_changes: (a) => getRecentChanges(a as { days?: number; category?: string }),
  get_agent_stats: (a) => getAgentStats(a as { agent?: string }),
  compare_brands: (a) => compareBrands(a as { domains?: string[] }),
};

function ok(id: number | string | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(id: number | string | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

/** Handle one JSON-RPC message. Returns null for notifications (no response). */
export function handleMcpMessage(msg: JsonRpcRequest): JsonRpcResponse | null {
  const id = msg.id ?? null;
  const isNotification = msg.id === undefined;

  try {
    switch (msg.method) {
      case "initialize": {
        const requested = (msg.params?.protocolVersion as string) ?? DEFAULT_PROTOCOL_VERSION;
        const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : DEFAULT_PROTOCOL_VERSION;
        return ok(id, {
          protocolVersion,
          capabilities: { tools: {}, resources: {} },
          serverInfo: SERVER_INFO,
          instructions: `ARC Report is the public reference dataset for AI agent access in e-commerce: 1,000+ brands scanned daily. Use get_brand_status for one brand, search_brands to filter the index, compare_brands for side-by-side views, get_agent_stats for index-level blocking rates, and get_recent_changes for confirmed policy changes. All data is CC BY 4.0; cite the source_url and last_updated returned with every response. Full docs: ${SITE_URL}/docs/mcp`,
        });
      }
      case "ping":
        return ok(id, {});
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "tools/list":
        return ok(id, { tools: TOOLS });
      case "prompts/list":
        return ok(id, { prompts: [] });
      case "resources/list":
        return ok(id, { resources: RESOURCES });
      case "resources/read": {
        const uri = msg.params?.uri as string | undefined;
        if (uri === "arc://methodology") {
          return ok(id, {
            contents: [{ uri, mimeType: "text/markdown", text: methodologyMarkdown() }],
          });
        }
        if (uri === "arc://insights/latest") {
          return ok(id, {
            contents: [{ uri, mimeType: "text/markdown", text: insightsMarkdown() }],
          });
        }
        return err(id, -32002, `Unknown resource: ${uri}. Available: ${RESOURCES.map((r) => r.uri).join(", ")}`);
      }
      case "tools/call": {
        const name = msg.params?.name as string | undefined;
        const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
        const handler = name ? TOOL_HANDLERS[name] : undefined;
        if (!handler) {
          return err(id, -32602, `Unknown tool: ${name}. Available: ${Object.keys(TOOL_HANDLERS).join(", ")}`);
        }
        try {
          const result = handler(args);
          return ok(id, {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            structuredContent: result,
            isError: false,
          });
        } catch (e) {
          if (e instanceof ToolInputError) {
            return ok(id, {
              content: [{ type: "text", text: `Invalid input: ${e.message}` }],
              isError: true,
            });
          }
          throw e;
        }
      }
      default:
        if (isNotification) return null;
        return err(id, -32601, `Method not found: ${msg.method}`);
    }
  } catch (e) {
    return err(id, -32603, `Internal error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Handle a raw POST body (single message or batch). */
export function handleMcpBody(body: unknown): JsonRpcResponse | JsonRpcResponse[] | null {
  if (Array.isArray(body)) {
    const responses = body
      .map((m) => handleMcpMessage(m as JsonRpcRequest))
      .filter((r): r is JsonRpcResponse => r !== null);
    return responses.length > 0 ? responses : null;
  }
  if (body && typeof body === "object" && (body as JsonRpcRequest).jsonrpc === "2.0") {
    return handleMcpMessage(body as JsonRpcRequest);
  }
  return {
    jsonrpc: "2.0",
    id: null,
    error: { code: -32700, message: "Parse error: expected a JSON-RPC 2.0 message" },
  };
}

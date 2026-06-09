import { NextRequest, NextResponse } from "next/server";
import { handleMcpBody, SERVER_INFO } from "@/lib/mcp/server";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(ip, 60, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limit exceeded (60 requests/minute per IP). Try again shortly." } },
      { status: 429, headers: CORS_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: body must be JSON" } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const response = handleMcpBody(body);
  if (response === null) {
    // Notification(s) only — acknowledge with no body per Streamable HTTP spec.
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }
  return NextResponse.json(response, { headers: CORS_HEADERS });
}

// Stateless server: no SSE stream; clients fall back to plain JSON responses.
export async function GET() {
  return NextResponse.json(
    {
      name: SERVER_INFO.name,
      description:
        "ARC Report MCP server — the public reference dataset for AI agent access in e-commerce. Connect any MCP client via Streamable HTTP (POST JSON-RPC to this URL). No auth required for reads.",
      transport: "streamable-http",
      docs: `${SITE_URL}/docs/mcp`,
    },
    { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } },
  );
}

export async function DELETE() {
  // Session teardown is a no-op for a stateless server.
  return new Response(null, { status: 202, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { hashToken, workspaceHasPaidAccess } from "@/lib/agency/core";
import { handleAgencyMcp } from "@/lib/agency/mcp";
import { rateLimit } from "@/lib/rate-limit";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
};

export async function POST(request: NextRequest) {
  const rawKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const key = db.select().from(schema.agencyApiKeys).where(and(
    eq(schema.agencyApiKeys.keyHash, hashToken(rawKey)),
    isNull(schema.agencyApiKeys.revokedAt),
  )).get();
  if (!key) return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: cors });
  const workspace = db.select().from(schema.agencyWorkspaces).where(eq(schema.agencyWorkspaces.id, key.workspaceId)).get();
  if (!workspace || !workspaceHasPaidAccess(workspace)) {
    return NextResponse.json({ error: "An active or trialing Agency plan is required" }, { status: 402, headers: cors });
  }
  if (!rateLimit(`agency-mcp:${key.id}`, 120, 60000).success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: cors });
  }
  db.update(schema.agencyApiKeys).set({ lastUsedAt: new Date().toISOString() }).where(eq(schema.agencyApiKeys.id, key.id)).run();
  const response = handleAgencyMcp(await request.json(), workspace.id);
  if (response === null) return new Response(null, { status: 202, headers: cors });
  return NextResponse.json(response, { headers: cors });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

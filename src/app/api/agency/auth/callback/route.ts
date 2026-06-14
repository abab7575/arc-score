import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createAgencySessionToken, AGENCY_SESSION_COOKIE_NAME } from "@/lib/auth";
import { hashToken, recordAgencyEvent } from "@/lib/agency/core";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const login = db.select().from(schema.agencyLoginTokens).where(and(
    eq(schema.agencyLoginTokens.tokenHash, hashToken(token)),
    isNull(schema.agencyLoginTokens.usedAt),
    sql`${schema.agencyLoginTokens.expiresAt} > ${new Date().toISOString()}`,
  )).get();
  if (!login?.workspaceId) return NextResponse.redirect(new URL("/agency/login?error=This+link+is+invalid+or+expired", request.url));
  const workspace = db.select().from(schema.agencyWorkspaces).where(eq(schema.agencyWorkspaces.id, login.workspaceId)).get();
  if (!workspace) return NextResponse.redirect(new URL("/agency/login?error=Workspace+not+found", request.url));
  let customer = db.select().from(schema.customers).where(eq(schema.customers.email, login.email)).get();
  if (!customer) {
    customer = db.insert(schema.customers).values({
      email: login.email,
      passwordHash: "passwordless",
      name: login.email.split("@")[0],
      plan: "free",
    }).returning().get();
  }
  if (workspace.customerId && workspace.customerId !== customer.id) {
    return NextResponse.redirect(new URL("/agency/login?error=Workspace+already+claimed", request.url));
  }
  db.update(schema.agencyWorkspaces).set({
    customerId: customer.id,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.agencyWorkspaces.id, workspace.id)).run();
  db.update(schema.agencyLoginTokens).set({ usedAt: new Date().toISOString() }).where(eq(schema.agencyLoginTokens.id, login.id)).run();
  recordAgencyEvent(workspace.id, "workspace_claimed", { email: login.email });
  const session = await createAgencySessionToken({ customerId: customer.id, workspaceId: workspace.id, email: login.email });
  const response = NextResponse.redirect(new URL("/agency", request.url));
  response.cookies.set(AGENCY_SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

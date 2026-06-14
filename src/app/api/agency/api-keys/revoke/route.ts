import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAgencySession } from "@/lib/agency/core";

export async function POST(request: Request) {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await request.formData()).get("id"));
  db.update(schema.agencyApiKeys).set({ revokedAt: new Date().toISOString() }).where(and(
    eq(schema.agencyApiKeys.id, id),
    eq(schema.agencyApiKeys.workspaceId, auth.workspace.id),
  )).run();
  return NextResponse.redirect(new URL("/agency/settings", request.url), 303);
}

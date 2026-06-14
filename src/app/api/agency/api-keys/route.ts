import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { createOpaqueToken, getAgencySession, hashToken, workspaceHasPaidAccess } from "@/lib/agency/core";
import { publicUrl } from "@/lib/public-url";

export async function POST() {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspaceHasPaidAccess(auth.workspace)) return NextResponse.redirect(publicUrl("/agency/billing"), 303);
  const rawKey = `arc_${createOpaqueToken()}`;
  db.insert(schema.agencyApiKeys).values({
    workspaceId: auth.workspace.id,
    keyHash: hashToken(rawKey),
    keyPrefix: rawKey.slice(0, 12),
  }).run();
  (await cookies()).set("arc_new_api_key", rawKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/agency/settings",
    maxAge: 300,
  });
  return NextResponse.redirect(publicUrl("/agency/settings"), 303);
}

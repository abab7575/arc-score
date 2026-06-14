import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAgencySession } from "@/lib/agency/core";
import { publicUrl } from "@/lib/public-url";

export async function POST(request: Request) {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.formData();
  const name = String(data.get("name") || "").trim();
  const logoUrl = String(data.get("logoUrl") || "").trim();
  const primaryColor = String(data.get("primaryColor") || "");
  if (!name || !/^#[0-9a-f]{6}$/i.test(primaryColor)) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  db.update(schema.agencyWorkspaces).set({
    name,
    logoUrl: logoUrl || null,
    primaryColor,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.agencyWorkspaces.id, auth.workspace.id)).run();
  return NextResponse.redirect(publicUrl("/agency/settings"), 303);
}

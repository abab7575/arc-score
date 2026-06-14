import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { db, schema } from "@/lib/db";
import { getAgencySession, recordAgencyEvent, workspaceHasPaidAccess } from "@/lib/agency/core";
import { publicUrl } from "@/lib/public-url";

export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspaceHasPaidAccess(auth.workspace)) return NextResponse.redirect(publicUrl("/agency/billing"), 303);
  const siteId = Number((await request.formData()).get("siteId"));
  const site = db.select().from(schema.agencySites).where(and(
    eq(schema.agencySites.id, siteId),
    eq(schema.agencySites.workspaceId, auth.workspace.id),
  )).get();
  if (!site?.brandId) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const brand = db.select().from(schema.brands).where(eq(schema.brands.id, site.brandId)).get();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  recordAgencyEvent(auth.workspace.id, "deep_scan_started", { domain: site.domain });
  execFile("npx", ["tsx", "scripts/agency-deep-scan.ts", brand.slug], { cwd: process.cwd() }, (error) => {
    recordAgencyEvent(auth.workspace.id, error ? "deep_scan_failed" : "deep_scan_completed", {
      domain: site.domain,
      ...(error ? { error: error.message } : {}),
    });
  });
  return NextResponse.redirect(publicUrl("/agency/sites"), 303);
}

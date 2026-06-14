import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { insertLightweightScan } from "@/lib/db/queries";
import { runLightweightScan } from "@/lib/scanner/lightweight-scanner";
import { AGENCY_SITE_LIMIT, getAgencySession, getWorkspaceSites, normalizeDomain, recordAgencyEvent } from "@/lib/agency/core";
import { publicUrl } from "@/lib/public-url";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const domain = normalizeDomain(String(form.get("domain") || ""));
  const relationship = String(form.get("relationship")) === "client" ? "client" : "prospect";
  if (!domain.includes(".")) return NextResponse.redirect(publicUrl("/agency/sites?error=Enter+a+valid+domain"), 303);
  if (getWorkspaceSites(auth.workspace.id).length >= AGENCY_SITE_LIMIT) {
    return NextResponse.redirect(publicUrl("/agency/sites?error=Your+50-site+limit+has+been+reached"), 303);
  }
  const duplicate = db.select().from(schema.agencySites).where(eq(schema.agencySites.domain, domain)).all()
    .find((site) => site.workspaceId === auth.workspace.id);
  if (duplicate) return NextResponse.redirect(publicUrl("/agency/sites?error=That+site+is+already+in+the+portfolio"), 303);
  try {
    let brand = db.select().from(schema.brands).all().find((item) => normalizeDomain(item.url) === domain);
    const result = await runLightweightScan(domain);
    if (!brand) {
      const baseSlug = domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-");
      let slug = baseSlug;
      let suffix = 2;
      while (db.select().from(schema.brands).where(eq(schema.brands.slug, slug)).get()) slug = `${baseSlug}-${suffix++}`;
      brand = db.insert(schema.brands).values({
        slug,
        name: domain,
        url: `https://${domain}`,
        category: "agency-portfolio",
      }).returning().get();
    }
    insertLightweightScan(brand.id, result);
    db.insert(schema.agencySites).values({
      workspaceId: auth.workspace.id,
      brandId: brand.id,
      domain,
      name: brand.name,
      relationship,
    }).run();
    recordAgencyEvent(auth.workspace.id, "site_added", { domain, relationship });
    return NextResponse.redirect(publicUrl("/agency/sites"), 303);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Scan failed");
    return NextResponse.redirect(publicUrl(`/agency/sites?error=${message}`), 303);
  }
}

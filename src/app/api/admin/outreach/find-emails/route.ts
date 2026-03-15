import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/outreach/find-emails
 * Triggers Apollo email lookup for all queued outreach items without emails.
 * Body: { maxCredits?: number } (default 10)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "APOLLO_API_KEY not configured" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const maxCredits = body.maxCredits ?? 10;

    // Get queued items without emails
    const needsEmail = db
      .select({
        id: schema.outreach.id,
        brandId: schema.outreach.brandId,
      })
      .from(schema.outreach)
      .where(eq(schema.outreach.status, "queued"))
      .all();

    if (needsEmail.length === 0) {
      return NextResponse.json({ message: "No items need email lookup", found: 0 });
    }

    const { batchFindContacts } = await import("@/lib/outreach/email-discovery");

    const domains = needsEmail.map((item: { id: number; brandId: number }) => {
      const brand = db
        .select({ url: schema.brands.url })
        .from(schema.brands)
        .where(eq(schema.brands.id, item.brandId))
        .get();
      return { brandId: item.brandId, domain: brand?.url ?? "", outreachId: item.id };
    }).filter((d: { domain: string }) => d.domain.length > 0);

    const results = await batchFindContacts(
      domains.slice(0, maxCredits),
      maxCredits
    );

    let emailsFound = 0;
    for (const [brandId, result] of results) {
      if (result.found && result.contact?.email) {
        const outreachItem = domains.find((d: { brandId: number }) => d.brandId === brandId);
        if (outreachItem) {
          db.update(schema.outreach)
            .set({
              contactEmail: result.contact.email,
              contactName: result.contact.name,
              contactTitle: result.contact.title,
              emailSource: "apollo",
              status: "ready",
            })
            .where(eq(schema.outreach.id, outreachItem.outreachId))
            .run();
          emailsFound++;
        }
      }
    }

    return NextResponse.json({
      searched: results.size,
      found: emailsFound,
      creditsRemaining: maxCredits - emailsFound,
      message: `Found ${emailsFound} emails out of ${results.size} lookups`,
    });
  } catch (error) {
    console.error("Error finding emails:", error);
    return NextResponse.json({ error: "Email lookup failed" }, { status: 500 });
  }
}

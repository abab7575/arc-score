import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, desc, eq, isNull } from "drizzle-orm";

function authorize(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authError = authorize(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "5", 10);
  const maxCredits = parseInt(url.searchParams.get("maxCredits") ?? "5", 10);
  const category = url.searchParams.get("category") ?? undefined;

  const { generateSignalOutreachQueue, insertSignalOutreachItems } = await import("@/lib/outreach/signal-generate");
  const { items, stats } = generateSignalOutreachQueue({ limit, category });
  const insertResult = insertSignalOutreachItems(items);

  let emailsFound = 0;

  if (process.env.APOLLO_API_KEY && maxCredits > 0) {
    const { batchFindContacts } = await import("@/lib/outreach/email-discovery");

    const queuedWithoutEmail = db
      .select({
        id: schema.outreach.id,
        brandId: schema.outreach.brandId,
      })
      .from(schema.outreach)
      .where(
        and(
          eq(schema.outreach.status, "queued"),
          isNull(schema.outreach.contactEmail),
        ),
      )
      .orderBy(desc(schema.outreach.createdAt))
      .limit(maxCredits)
      .all();

    const domains = queuedWithoutEmail.map((item) => {
      const brand = db
        .select({ url: schema.brands.url })
        .from(schema.brands)
        .where(eq(schema.brands.id, item.brandId))
        .get();

      return {
        brandId: item.brandId,
        outreachId: item.id,
        domain: brand?.url ?? "",
      };
    }).filter((item) => item.domain.length > 0);

    const results = await batchFindContacts(
      domains.map((item) => ({ brandId: item.brandId, domain: item.domain })),
      maxCredits,
    );

    for (const [brandId, result] of results) {
      if (!result.found || !result.contact?.email) continue;

      const outreachItem = domains.find((item) => item.brandId === brandId);
      if (!outreachItem) continue;

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

  return NextResponse.json({
    status: "complete",
    generated: items.length,
    inserted: insertResult.inserted,
    duplicates: insertResult.duplicates,
    needsReview: insertResult.needsReview,
    emailsFound,
    generationStats: stats,
    errors: insertResult.errors.length > 0 ? insertResult.errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

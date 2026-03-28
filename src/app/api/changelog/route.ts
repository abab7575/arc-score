import { NextRequest, NextResponse } from "next/server";
import { getRecentChangelog } from "@/lib/db/queries";
import { verifyCustomerSession, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Check if user is Pro to determine limit
  let isPro = false;

  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (token) {
    const customerId = await verifyCustomerSession(token);
    if (customerId) {
      const customer = db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, customerId))
        .get();
      if (customer && customer.plan === "pro") {
        isPro = true;
      }
    }
  }

  const limit = isPro ? 500 : 5;
  const entries = getRecentChangelog(limit);

  // Enrich with brand names
  const brandIds = [...new Set(entries.map(e => e.brandId))];
  const brands = db
    .select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name })
    .from(schema.brands)
    .all();
  const brandMap = new Map(brands.map(b => [b.id, b]));

  return NextResponse.json({
    isPro,
    totalAvailable: isPro ? entries.length : undefined,
    entries: entries.map(entry => ({
      ...entry,
      brandSlug: brandMap.get(entry.brandId)?.slug ?? "unknown",
      brandName: brandMap.get(entry.brandId)?.name ?? "Unknown",
    })),
  });
}

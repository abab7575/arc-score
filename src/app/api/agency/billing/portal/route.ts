import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAgencySession } from "@/lib/agency/core";
import { getStripe } from "@/lib/agency/stripe";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = db.select().from(schema.customers).where(eq(schema.customers.id, auth.session.customerId)).get();
  if (!customer?.stripeCustomerId) return NextResponse.redirect(`${SITE_URL}/agency/billing`, 303);
  const session = await getStripe().billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${SITE_URL}/agency/billing`,
  });
  return NextResponse.redirect(session.url, 303);
}

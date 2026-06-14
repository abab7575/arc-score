import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAgencySession, recordAgencyEvent } from "@/lib/agency/core";
import { billingEnvironmentReady, getStripe } from "@/lib/agency/stripe";
import { SITE_URL } from "@/lib/site";

export async function POST(request: Request) {
  const auth = await getAgencySession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingEnvironmentReady()) {
    return NextResponse.redirect(new URL("/agency/billing?error=Live+billing+is+not+configured", request.url), 303);
  }
  const price = process.env.STRIPE_AGENCY_PRICE_ID;
  if (!price) return NextResponse.json({ error: "STRIPE_AGENCY_PRICE_ID not configured" }, { status: 503 });
  const stripe = getStripe();
  const stripePrice = await stripe.prices.retrieve(price);
  if (process.env.NODE_ENV === "production" && !stripePrice.livemode) {
    return NextResponse.redirect(new URL("/agency/billing?error=Live+billing+is+not+configured", request.url), 303);
  }
  const customer = db.select().from(schema.customers).where(eq(schema.customers.id, auth.session.customerId)).get();
  if (!customer) return NextResponse.json({ error: "Customer missing" }, { status: 404 });
  let stripeCustomerId = customer.stripeCustomerId;
  if (!stripeCustomerId) {
    const created = await stripe.customers.create({
      email: customer.email,
      name: customer.name ?? auth.workspace.name,
      metadata: { workspaceId: String(auth.workspace.id) },
    });
    stripeCustomerId = created.id;
    db.update(schema.customers).set({ stripeCustomerId }).where(eq(schema.customers.id, customer.id)).run();
  }
  const previousSubscription = db.select().from(schema.subscriptions)
    .where(eq(schema.subscriptions.customerId, customer.id)).get();
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      ...(previousSubscription ? {} : { trial_period_days: 14 }),
      metadata: { workspaceId: String(auth.workspace.id), customerId: String(customer.id) },
    },
    metadata: { workspaceId: String(auth.workspace.id), customerId: String(customer.id) },
    success_url: `${SITE_URL}/agency/billing?checkout=success`,
    cancel_url: `${SITE_URL}/agency/billing?checkout=canceled`,
    allow_promotion_codes: true,
  });
  recordAgencyEvent(auth.workspace.id, "checkout_started");
  return NextResponse.redirect(checkout.url!, 303);
}

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { getStripe } from "@/lib/agency/stripe";
import { recordAgencyEvent } from "@/lib/agency/core";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const workspaceId = Number(subscription.metadata.workspaceId);
    const customerId = Number(subscription.metadata.customerId);
    if (workspaceId && customerId) {
      const status = subscription.status === "trialing" ? "trialing"
        : subscription.status === "active" ? "active"
        : subscription.status === "past_due" || subscription.status === "unpaid" ? "past_due"
        : "canceled";
      const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
      db.update(schema.agencyWorkspaces).set({
        status,
        trialEndsAt,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.agencyWorkspaces.id, workspaceId)).run();
      const item = subscription.items.data[0];
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : new Date().toISOString();
      const existing = db.select().from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id)).get();
      const values = {
        customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price.id ?? process.env.STRIPE_AGENCY_PRICE_ID ?? "",
        plan: "agency",
        status: subscription.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date().toISOString(),
      };
      if (existing) db.update(schema.subscriptions).set(values).where(eq(schema.subscriptions.id, existing.id)).run();
      else db.insert(schema.subscriptions).values(values).run();
      db.update(schema.customers).set({ plan: status === "active" || status === "trialing" ? "agency" : "free" })
        .where(eq(schema.customers.id, customerId)).run();
      recordAgencyEvent(workspaceId, "subscription_updated", { status: subscription.status });
    }
  }
  return NextResponse.json({ received: true });
}

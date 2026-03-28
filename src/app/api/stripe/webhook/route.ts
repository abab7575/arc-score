import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import {
  getCustomerByStripeId,
  getCustomerById,
  updateCustomerPlan,
  updateCustomerStripeId,
  upsertSubscription,
  deleteSubscription,
} from "@/lib/customer-auth";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        handlePaymentFailed(invoice);
        break;
      }
    }
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function getSubscriptionPeriodEnd(sub: Stripe.Subscription): string {
  // In newer Stripe API versions, use cancel_at or billing_cycle_anchor as approximation
  if (sub.cancel_at) {
    return new Date(sub.cancel_at * 1000).toISOString();
  }
  // Approximate from billing_cycle_anchor + 1 month
  const anchor = new Date(sub.billing_cycle_anchor * 1000);
  anchor.setMonth(anchor.getMonth() + 1);
  return anchor.toISOString();
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const stripeCustomerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const internalCustomerId = session.metadata?.customerId;

  // Get subscription details from Stripe
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan = getPlanByPriceId(priceId);
  const planId = plan?.id ?? "pro";

  // Find or link the customer
  let customer = getCustomerByStripeId(stripeCustomerId);

  if (!customer && internalCustomerId) {
    const id = parseInt(internalCustomerId);
    updateCustomerStripeId(id, stripeCustomerId);
    customer = getCustomerById(id) ?? undefined;
  }

  if (customer) {
    updateCustomerPlan(customer.id, planId);
    upsertSubscription({
      customerId: customer.id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      plan: planId,
      status: sub.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  }
}

function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const stripeCustomerId = sub.customer as string;
  const customer = getCustomerByStripeId(stripeCustomerId);
  if (!customer) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan = getPlanByPriceId(priceId);
  const planId = plan?.id ?? "pro";

  const isActive = ["active", "trialing"].includes(sub.status);
  updateCustomerPlan(customer.id, isActive ? planId : "free");

  upsertSubscription({
    customerId: customer.id,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    plan: planId,
    status: sub.status,
    currentPeriodEnd: getSubscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const stripeCustomerId = sub.customer as string;
  const customer = getCustomerByStripeId(stripeCustomerId);
  if (!customer) return;

  updateCustomerPlan(customer.id, "free");
  deleteSubscription(sub.id);
}

function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = invoice.customer as string;
  if (!stripeCustomerId) return;

  const customer = getCustomerByStripeId(stripeCustomerId);
  if (!customer) return;

  console.warn(`Payment failed for customer ${customer.email}`);
}

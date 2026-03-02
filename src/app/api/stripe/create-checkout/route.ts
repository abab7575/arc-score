import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { verifyCustomerSession, getCustomerById, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    if (!planId || !PLANS[planId as PlanId] || planId === "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];
    if (!plan.priceId) {
      return NextResponse.json({ error: "Plan not configured in Stripe" }, { status: 500 });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Check if user is logged in — pre-fill their email and link to Stripe customer
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;
    let stripeCustomerId: string | undefined;
    let customerEmail: string | undefined;

    if (customerId) {
      const customer = getCustomerById(customerId);
      if (customer) {
        customerEmail = customer.email;
        if (customer.stripeCustomerId) {
          stripeCustomerId = customer.stripeCustomerId;
        }
      }
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { planId, ...(customerId ? { customerId: String(customerId) } : {}) },
    };

    if (stripeCustomerId) {
      params.customer = stripeCustomerId;
    } else if (customerEmail) {
      params.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

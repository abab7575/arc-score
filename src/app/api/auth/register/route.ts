import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  createCustomer,
  getCustomerByEmail,
  getCustomerByStripeId,
  updateCustomerPlan,
  updateCustomerStripeId,
  upsertSubscription,
  createCustomerSession,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 3, 60000);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    const { email, password, name, stripeSessionId } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check if customer already exists
    const existing = getCustomerByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // If they came from Stripe checkout, link their subscription
    let stripeCustomerId: string | undefined;
    let plan = "free";

    if (stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        if (session.customer) {
          stripeCustomerId = session.customer as string;
        }
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price.id ?? "";
          const planConfig = getPlanByPriceId(priceId);
          plan = planConfig?.id ?? "pro";
        }
      } catch {
        // Stripe session may have expired — still create the account
      }
    }

    const customer = createCustomer({
      email,
      passwordHash,
      name,
      stripeCustomerId,
    });

    // Update plan if they paid
    if (plan !== "free") {
      updateCustomerPlan(customer.id, plan);

      // Also record the subscription
      if (stripeSessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = sub.items.data[0]?.price.id ?? "";
            const planConfig = getPlanByPriceId(priceId);
            upsertSubscription({
              customerId: customer.id,
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId,
              plan: planConfig?.id ?? "monitor",
              status: sub.status,
              currentPeriodEnd: sub.cancel_at
                ? new Date(sub.cancel_at * 1000).toISOString()
                : new Date(sub.billing_cycle_anchor * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            });
          }
        } catch {
          // Non-critical — webhook will catch it
        }
      }
    }

    // Create session
    const token = await createCustomerSession(customer.id);
    const response = NextResponse.json({
      success: true,
      plan,
      customerId: customer.id,
    });

    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

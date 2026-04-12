import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerSession,
  getCustomerById,
  getActiveSubscription,
  getClaimedBrands,
  expireTrialIfNeeded,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";
import { PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;

    if (!customerId) {
      return NextResponse.json({ authenticated: false });
    }

    const rawCustomer = getCustomerById(customerId);
    if (!rawCustomer) {
      return NextResponse.json({ authenticated: false });
    }

    const customer = expireTrialIfNeeded(rawCustomer);
    const subscription = getActiveSubscription(customerId);
    const claims = getClaimedBrands(customerId);
    const plan = PLANS[customer.plan as keyof typeof PLANS] ?? PLANS.free;
    const isTrialing =
      !!customer.trialEndsAt && new Date(customer.trialEndsAt).getTime() > Date.now();

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        plan: customer.plan,
        planName: plan.name,
        isPro: customer.plan !== "free",
        isTrialing,
        trialEndsAt: customer.trialEndsAt,
        brandLimit: customer.plan === "pro" ? 10 : 0,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      claimedBrandIds: claims.map((c) => c.brandId),
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ authenticated: false });
  }
}

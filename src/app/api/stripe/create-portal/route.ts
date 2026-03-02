import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyCustomerSession, getCustomerById, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;

    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customer = getCustomerById(customerId);
    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${baseUrl}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}

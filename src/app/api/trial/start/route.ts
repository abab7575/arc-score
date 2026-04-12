import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerSession,
  getCustomerById,
  startCustomerTrial,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 10, 60000);
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  const customerId = token ? await verifyCustomerSession(token) : null;
  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const customer = getCustomerById(customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (customer.trialUsed) {
    return NextResponse.json(
      { error: "Trial already used. Upgrade to continue." },
      { status: 400 },
    );
  }

  if (customer.plan !== "free") {
    return NextResponse.json(
      { error: "You already have Pro access." },
      { status: 400 },
    );
  }

  startCustomerTrial(customerId);
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json({
    success: true,
    plan: "pro",
    trialEndsAt,
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerSession,
  getCustomerById,
  getClaimedBrands,
  claimBrand,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";
import { PLANS, type PlanId } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;

    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customer = getCustomerById(customerId);
    if (!customer || customer.plan === "free") {
      return NextResponse.json({ error: "Upgrade required to claim brands" }, { status: 403 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    // Check brand limit
    const plan = PLANS[customer.plan as PlanId] ?? PLANS.free;
    const claimed = getClaimedBrands(customerId);
    if (claimed.length >= plan.brandLimit) {
      return NextResponse.json(
        { error: `You can only claim up to ${plan.brandLimit} brand${plan.brandLimit === 1 ? "" : "s"} on the ${plan.name} plan` },
        { status: 403 }
      );
    }

    // Check if already claimed
    if (claimed.some((c) => c.brandId === brandId)) {
      return NextResponse.json({ error: "Brand already claimed" }, { status: 409 });
    }

    const claim = claimBrand(customerId, brandId);
    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("Claim brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

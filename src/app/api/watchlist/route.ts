import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerSession,
  getCustomerById,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistCount,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";

const WATCHLIST_LIMITS: Record<string, number> = {
  free: 0,
  pro: 10,
  agency: 50,
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const watchlist = getWatchlist(customerId);
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customer = getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const limit = WATCHLIST_LIMITS[customer.plan] ?? 0;
    if (limit === 0) {
      return NextResponse.json({ error: "Upgrade to Pro to track brands" }, { status: 403 });
    }

    const count = getWatchlistCount(customerId);
    if (count >= limit) {
      return NextResponse.json({
        error: `Watchlist limit reached (${limit} brands on ${customer.plan} plan)`,
      }, { status: 403 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    const entry = addToWatchlist(customerId, brandId);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    removeFromWatchlist(customerId, brandId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Watchlist DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

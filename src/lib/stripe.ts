import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
// Keep backward-compat export that lazily initializes
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type PlanId = "free" | "pro";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // monthly in dollars
  priceId: string; // Stripe Price ID from env
  features: string[];
}

export function getPLANS(): Record<PlanId, PlanConfig> {
  return {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      priceId: "",
      features: [
        "Full index — all brands, latest scan data",
        "Matrix view with agent access status",
        "Brand profiles with current snapshot",
        "5 most recent changelog entries",
      ],
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: 149,
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
      features: [
        "Everything in Free",
        "Historical data (90+ days of daily snapshots)",
        "Full weekly changelog across all brands",
        "CSV and JSON export of full dataset",
        "Comparison tool (any brands side-by-side)",
        "API access",
        "Email alerts on policy changes",
      ],
    },
  };
}

// For backward compat — accessed at runtime, not build time
export const PLANS = new Proxy({} as Record<PlanId, PlanConfig>, {
  get(_, prop) {
    return getPLANS()[prop as PlanId];
  },
  ownKeys() {
    return Object.keys(getPLANS());
  },
  getOwnPropertyDescriptor(_, prop) {
    const plans = getPLANS();
    if (prop in plans) {
      return { configurable: true, enumerable: true, value: plans[prop as PlanId] };
    }
    return undefined;
  },
});

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(getPLANS()).find((p) => p.priceId === priceId);
}

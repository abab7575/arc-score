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
  watchlistLimit: number;
}

export function getPLANS(): Record<PlanId, PlanConfig> {
  return {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      priceId: "",
      watchlistLimit: 0,
      features: [
        "Full public index — all 1,000+ brands",
        "Matrix view with agent access status",
        "Brand readouts with current snapshot",
        "3 most recent changelog entries",
        "Weekly digest email",
        "Public API access",
      ],
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: 149,
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
      watchlistLimit: 10,
      features: [
        "Everything in Free",
        "Watchlists — track up to 10 brands",
        "Daily change alerts via email",
        "Full changelog history (90+ days)",
        "CSV and JSON data export",
        "Claim your brand profile",
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

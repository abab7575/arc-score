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

export type PlanId = "free" | "monitor" | "team";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // monthly in dollars
  priceId: string; // Stripe Price ID from env
  brandLimit: number;
  features: string[];
}

export function getPLANS(): Record<PlanId, PlanConfig> {
  return {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      priceId: "",
      brandLimit: 0,
      features: [
        "Public score & grade (0-100)",
        "7 category score breakdown",
        "Top 3 agent compatibility",
        "1 agent journey screenshot (the fail moment)",
        "Issue count (e.g. '12 issues found')",
        "Estimated score after fixes",
      ],
    },
    monitor: {
      id: "monitor",
      name: "Monitor",
      price: 99,
      priceId: process.env.STRIPE_MONITOR_PRICE_ID ?? "",
      brandLimit: 1,
      features: [
        "Everything in Free",
        "Full findings with fix instructions",
        "All 10 AI agent scoring lenses",
        "Agent journey replays with screenshots",
        "Prioritized action plan",
        "Weekly automated rescans",
        "Score change alerts",
        "90-day score history",
        "3 competitor comparisons",
      ],
    },
    team: {
      id: "team",
      name: "Team",
      price: 299,
      priceId: process.env.STRIPE_TEAM_PRICE_ID ?? "",
      brandLimit: 5,
      features: [
        "Everything in Monitor",
        "Up to 5 brands",
        "Daily automated rescans",
        "Unlimited score history",
        "10 competitor comparisons",
        "Compare brands side-by-side",
        "PDF reports",
        "Slack alerts",
        "Priority email support",
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

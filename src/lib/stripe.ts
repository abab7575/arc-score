import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type PlanId = "free" | "monitor" | "team";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // monthly in dollars
  priceId: string; // Stripe Price ID from env
  brandLimit: number;
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceId: "",
    brandLimit: 0,
    features: [
      "Public score & grade",
      "Top-level category breakdown",
      "Top 3 agent compatibility",
      "7-day score sparkline",
    ],
  },
  monitor: {
    id: "monitor",
    name: "Monitor",
    price: 79,
    priceId: process.env.STRIPE_MONITOR_PRICE_ID ?? "",
    brandLimit: 1,
    features: [
      "Everything in Free",
      "Full findings with severity & details",
      "All 10 AI agent scores",
      "Score history & trend tracking",
      "Prioritized action plan",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 249,
    priceId: process.env.STRIPE_TEAM_PRICE_ID ?? "",
    brandLimit: 5,
    features: [
      "Everything in Monitor",
      "Up to 5 brands",
      "Compare brands side-by-side",
      "Priority email support",
    ],
  },
};

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find((p) => p.priceId === priceId);
}

import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

export function billingEnvironmentReady(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const price = process.env.STRIPE_AGENCY_PRICE_ID || "";
  if (!key || !price || !process.env.STRIPE_WEBHOOK_SECRET) return false;
  return process.env.NODE_ENV !== "production" || key.startsWith("sk_live_");
}

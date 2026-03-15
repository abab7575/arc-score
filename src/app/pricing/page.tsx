"use client";

import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Check, Loader2, X } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "See the problem",
    features: [
      { text: "Public score & grade (0-100)", included: true },
      { text: "7 category score breakdown", included: true },
      { text: "Top 3 agent compatibility", included: true },
      { text: "1 agent journey screenshot", included: true },
      { text: "Issue count + estimated score after fixes", included: true },
      { text: "Full findings & fix instructions", included: false },
      { text: "Agent journey replays", included: false },
      { text: "Action plan", included: false },
      { text: "Automated rescans", included: false },
    ],
    cta: "Browse the Index",
    ctaHref: "/",
    highlighted: false,
  },
  {
    id: "monitor",
    name: "Monitor",
    monthly: 99,
    annual: 79,
    description: "Fix the problem",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Full findings with fix instructions", included: true },
      { text: "All 10 AI agent scoring lenses", included: true },
      { text: "Agent journey replays + screenshots", included: true },
      { text: "Prioritized action plan", included: true },
      { text: "Weekly automated rescans", included: true },
      { text: "Score change alerts (email)", included: true },
      { text: "90-day score history", included: true },
      { text: "3 competitor comparisons", included: true },
    ],
    cta: "Start Monitoring",
    ctaHref: null,
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    monthly: 299,
    annual: 239,
    description: "Fix it across brands",
    features: [
      { text: "Everything in Monitor", included: true },
      { text: "Up to 5 brands", included: true },
      { text: "Daily automated rescans", included: true },
      { text: "Unlimited score history", included: true },
      { text: "10 competitor comparisons", included: true },
      { text: "Compare brands side-by-side", included: true },
      { text: "PDF reports", included: true },
      { text: "Slack alerts", included: true },
      { text: "Priority email support", included: true },
    ],
    cta: "Start Team Plan",
    ctaHref: null,
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, annual }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setLoading(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            See the problem free. Fix it with a plan.
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Free scores show where AI agents fail on your site.
            Paid plans show you exactly what&apos;s broken, replay agent journeys,
            and tell you how to fix it.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              annual ? "bg-[#059669]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                annual ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
          </span>
          {annual && (
            <span className="text-xs font-bold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-6 border-2 ${
                  plan.highlighted
                    ? "border-[#FF6648] bg-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6648] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <span className="text-3xl font-black text-foreground">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">${price}</span>
                      <span className="text-muted-foreground">/mo</span>
                      {annual && plan.monthly > 0 && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          ${plan.monthly}
                        </span>
                      )}
                    </div>
                  )}
                  {annual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually at ${price * 12}/yr
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.ctaHref ? (
                  <a
                    href={plan.ctaHref}
                    className="block text-center py-3 border-2 border-gray-200 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                      plan.highlighted
                        ? "bg-[#FF6648] text-white hover:bg-[#e85a3f]"
                        : "bg-[#0A1628] text-white hover:bg-[#0A1628]/90"
                    } disabled:opacity-50`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            All plans include access to the full public index. Cancel anytime.
            Need more than 5 brands? <a href="mailto:hello@robotshopper.com" className="text-[#0259DD] hover:underline">Get in touch</a> for custom pricing.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

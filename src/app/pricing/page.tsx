"use client";

import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Check, Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    description: "See where you stand",
    features: [
      "Public score & grade",
      "Top-level category breakdown",
      "Top 3 agent compatibility scores",
      "7-day score sparkline",
    ],
    cta: "View the Index",
    ctaHref: "/",
    highlighted: false,
  },
  {
    id: "monitor",
    name: "Monitor",
    price: 79,
    period: "/mo",
    description: "Know exactly what to fix",
    features: [
      "Everything in Free",
      "Full findings with severity & details",
      "All 10 AI agent scores",
      "Score history & trend tracking",
      "Prioritized action plan",
    ],
    cta: "Start Monitoring",
    ctaHref: null, // triggers checkout
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    price: 249,
    period: "/mo",
    description: "For agencies & multi-brand teams",
    features: [
      "Everything in Monitor",
      "Up to 5 brands",
      "Compare brands side-by-side",
      "Priority email support",
    ],
    cta: "Start Team Plan",
    ctaHref: null,
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
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
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Monitor Your AI Agent Readiness
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Free scores show the problem. Paid plans show you exactly what&apos;s broken,
            which agents are affected, and how your competitors compare.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-xl border-2 ${
                plan.highlighted
                  ? "border-[#0259DD] bg-[#0259DD]/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0259DD] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.price === 0 ? (
                  <span className="text-3xl font-black text-foreground">Free</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.ctaHref ? (
                <a
                  href={plan.ctaHref}
                  className="block text-center py-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "bg-[#0259DD] text-white hover:bg-[#0259DD]/90"
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
          ))}
        </div>

        {/* FAQ / Bottom note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            All plans include access to the full public index. Cancel anytime from your account page.
            Need a custom plan or want to discuss enterprise pricing?{" "}
            <a href="mailto:hello@getarcscore.com" className="text-[#0259DD] hover:underline">
              Get in touch
            </a>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

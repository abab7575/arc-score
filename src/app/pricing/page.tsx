"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Check, Loader2 } from "lucide-react";

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    period: "/forever",
    tagline: "Browse the full index",
    cta: "Browse the Index",
    ctaHref: "/",
    accent: false,
    features: [
      "Full public index — all 1,000+ brands",
      "Matrix view with agent access status",
      "Brand readouts with current snapshot",
      "3 most recent changelog entries",
      "Weekly digest email",
      "Public API access",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 149,
    period: "/mo",
    tagline: "30-day free trial — no card required",
    cta: "Start free trial",
    accent: true,
    features: [
      "30-day free trial — no card required",
      "Everything in Free",
      "Watchlists — track up to 10 brands",
      "Daily change alerts via email",
      "Full changes history (90+ days)",
      "CSV and JSON data export",
      "Claim your brand profile",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setCurrentPlan(data.customer.plan);
          setIsTrialing(!!data.customer.isTrialing);
        }
      })
      .catch(() => {});
  }, []);

  async function handleProCta() {
    if (!authenticated) {
      window.location.href = "/signup";
      return;
    }
    if (currentPlan === "free") {
      setLoading("pro");
      try {
        const res = await fetch("/api/trial/start", { method: "POST" });
        if (res.ok) {
          window.location.href = "/account?trial=started";
          return;
        }
        const data = await res.json();
        if (res.status === 400 && /already used/i.test(data.error ?? "")) {
          // Trial already consumed — fall through to paid checkout
          await handleCheckout("pro");
          return;
        }
        alert(data.error || "Failed to start trial");
      } catch {
        alert("Something went wrong. Please try again.");
      } finally {
        setLoading(null);
      }
      return;
    }
    // Already Pro or trialing → send to Stripe to add payment
    await handleCheckout("pro");
  }

  async function handleCheckout(planId: "pro") {
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
            Track agent access changes before your competitors do.
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            The free index shows every brand&apos;s agentic posture today.
            Pro adds watchlists, daily alerts, full history, and exports.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col p-7 border-2 bg-white ${
                tier.accent ? "border-[#FF6648]" : "border-gray-200"
              }`}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{tier.tagline}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-black text-foreground">
                  ${tier.price}
                </span>
                <span className="text-muted-foreground ml-1">{tier.period}</span>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === tier.id && !isTrialing ? (
                <div className="w-full py-3 text-sm font-bold text-center border-2 border-[#059669] text-[#059669] bg-emerald-50">
                  Your Current Plan
                </div>
              ) : currentPlan === tier.id && isTrialing ? (
                <button
                  onClick={() => handleCheckout("pro")}
                  disabled={loading !== null}
                  className="w-full py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 bg-[#FF6648] text-white hover:bg-[#e85a3f]"
                >
                  {loading === "pro" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Add payment to continue"
                  )}
                </button>
              ) : tier.id === "free" ? (
                <a
                  href={tier.ctaHref}
                  className="block text-center py-3 border-2 border-gray-200 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
                >
                  {tier.cta}
                </a>
              ) : (
                <button
                  onClick={handleProCta}
                  disabled={loading !== null}
                  className={`w-full py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    tier.accent
                      ? "bg-[#FF6648] text-white hover:bg-[#e85a3f]"
                      : "bg-[#0A1628] text-white hover:bg-[#0A1628]/90"
                  }`}
                >
                  {loading === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting trial...
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Trust / risk-reversal */}
        <div className="mt-8 max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Start today, cancel anytime. No contracts, no setup fees.
            <br className="hidden sm:inline" />{" "}
            Your first alert goes out within 24 hours of subscribing.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mt-16 max-w-3xl mx-auto overflow-x-auto">
          <table className="w-full border-2 border-gray-200 bg-white text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 font-bold text-foreground">Feature</th>
                <th className="text-center p-4 font-bold text-foreground">Free</th>
                <th className="text-center p-4 font-bold text-foreground border-l-2 border-gray-200">Pro — $149/mo</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Brand watchlists", "—", "Up to 10"],
                ["Daily change alerts", "—", "Email"],
                ["Changes history", "3 entries", "Full 90+ days"],
                ["Data exports", "—", "CSV + JSON"],
                ["Brand claiming", "—", "Included"],
                ["Weekly digest", "Included", "Included"],
              ].map(([feature, free, pro], i) => (
                <tr
                  key={feature}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}
                >
                  <td className="p-4 font-medium text-foreground">{feature}</td>
                  <td className="p-4 text-center text-muted-foreground">{free}</td>
                  <td className="p-4 text-center text-muted-foreground border-l-2 border-gray-200">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Social proof */}
        <div className="mt-16 max-w-2xl mx-auto border-2 border-gray-200 bg-white p-8">
          <h2 className="text-xl font-bold text-foreground mb-5">
            Who uses ARC Report?
          </h2>
          <ul className="space-y-4">
            <li>
              <p className="text-sm font-semibold text-foreground">Agency teams</p>
              <p className="text-sm text-muted-foreground">Tracking client AI readiness across portfolios</p>
            </li>
            <li>
              <p className="text-sm font-semibold text-foreground">E-commerce operators</p>
              <p className="text-sm text-muted-foreground">Monitoring competitor agent access policies</p>
            </li>
            <li>
              <p className="text-sm font-semibold text-foreground">AI agent builders</p>
              <p className="text-sm text-muted-foreground">Checking which sites are reachable before launch</p>
            </li>
            <li>
              <p className="text-sm font-semibold text-foreground">Platform teams</p>
              <p className="text-sm text-muted-foreground">Benchmarking their stack against 1,000+ peers</p>
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-5">
            Frequently Asked Questions
          </h2>
          <div className="space-y-0">
            {[
              {
                q: "How fresh is the data?",
                a: "Every brand is scanned daily. Changes are detected, confirmed across two scans, and published to the changelog.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel in one click from your account page. No contracts, no hidden fees.",
              },
              {
                q: "What\u2019s in the free tier?",
                a: "The full public index, brand pages, matrix view, and the 3 most recent changelog entries. It\u2019s always free.",
              },
              {
                q: "Do you offer annual pricing?",
                a: "Not yet. Email us at hello@arcreport.ai if you\u2019re interested.",
              },
              {
                q: "What agents do you track?",
                a: "GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Amazonbot, CCBot, and Bingbot.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="border-2 border-gray-200 bg-white p-5 -mt-[2px] first:mt-0"
              >
                <p className="text-sm font-bold text-foreground">{item.q}</p>
                <p className="text-sm text-muted-foreground mt-1.5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Cancel anytime. The free index is always free.
            Need a team plan or custom terms? <a href="mailto:hello@arcreport.ai" className="text-[#0259DD] hover:underline">Contact us</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

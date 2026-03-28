"use client";

import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Check, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "Full index — all brands, latest scan data",
  "Matrix view with agent access status",
  "Brand profiles with current snapshot",
  "Platform, CDN, and WAF detection",
  "Structured data and feed analysis",
  "5 most recent changelog entries",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Historical data — 90+ days of daily snapshots",
  "Full weekly changelog across all brands",
  "CSV and JSON export of full dataset",
  "Comparison tool — any brands side-by-side",
  "API access",
  "Email alerts on agent policy changes",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "pro" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            AI agent intelligence. Updated daily.
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            The free index shows you what every brand&apos;s agentic posture looks like today.
            Pro gives you the history, the exports, and the changelog.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="flex flex-col p-8 border-2 border-gray-200 bg-white">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-foreground">Free</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Browse the full index</p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-black text-foreground">$0</span>
              <span className="text-muted-foreground ml-1">/forever</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/"
              className="block text-center py-3 border-2 border-gray-200 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
            >
              Browse the Index
            </a>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col p-8 border-2 border-[#FF6648] bg-white">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6648] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
              Full Access
            </div>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-foreground">Pro</h3>
              <p className="text-sm text-muted-foreground mt-0.5">History, exports, and alerts</p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-black text-foreground">$100</span>
              <span className="text-muted-foreground ml-1">/mo</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 text-sm font-bold bg-[#FF6648] text-white hover:bg-[#e85a3f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                "Get Pro Access"
              )}
            </button>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Cancel anytime. The free index is always free.
            Need a team plan or API-only access? <a href="mailto:hello@arcreport.ai" className="text-[#0259DD] hover:underline">Get in touch</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

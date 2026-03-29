"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CheckCircle2, Send, Eye, FileText, BarChart3, Zap, Lock } from "lucide-react";
import { CATEGORY_LABELS, type BrandCategory } from "@/lib/brands";

const categories: BrandCategory[] = [
  "fashion", "electronics", "home", "beauty", "grocery", "general", "dtc", "luxury", "sports", "health", "pet", "kids",
];

export default function SubmitPage() {
  const [form, setForm] = useState({
    brandName: "",
    url: "",
    productUrl: "",
    category: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Get Your AI Agent Readiness Score
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            We send 5 AI shopping agents to your site. They try to find products,
            add to cart, and check out. You get a score, the findings, and
            exactly how to fix it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left — Form */}
          <div>
            {submitted ? (
              <div className="border-2 border-emerald-200 bg-emerald-50/50 p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">You&apos;re in the queue!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your brand will be scanned within 24 hours. We&apos;ll email you
                  at <strong>{form.email}</strong> when your free score is ready.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/pricing"
                    className="block w-full py-3 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors text-center"
                  >
                    Skip the wait — Get full report now ($149/mo)
                  </Link>
                  <Link
                    href="/"
                    className="block w-full py-3 border border-gray-200 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors text-center"
                  >
                    Browse the index while you wait
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="spec-label text-[9px] text-[#059669]">FREE SCAN</span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  Submit your store
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Free score within 24 hours. No credit card required.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.brandName}
                      onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                      placeholder="e.g. Nike"
                      className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#FF6648] transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Website URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      onBlur={() => {
                        const v = form.url.trim();
                        if (v && !/^https?:\/\//i.test(v)) {
                          setForm({ ...form, url: "https://" + v });
                        }
                      }}
                      placeholder="https://yourbrand.com"
                      className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#FF6648] transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Product Page URL <span className="text-muted-foreground/50">(optional, improves accuracy)</span>
                    </label>
                    <input
                      type="url"
                      value={form.productUrl}
                      onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                      placeholder="https://yourbrand.com/products/best-seller"
                      className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#FF6648] transition-colors font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#FF6648] transition-colors"
                      >
                        <option value="">Select...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Your Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@brand.com"
                        className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#FF6648] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors disabled:opacity-50"
                  >
                    <Send size={14} />
                    {submitting ? "Submitting..." : "Get My Free Score"}
                  </button>

                  <p className="text-[10px] text-muted-foreground/60 text-center">
                    Free scan includes your overall score, category breakdown, and grade.
                    Full findings, action plan, and agent replays require a paid plan.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* Right — What You Get */}
          <div className="space-y-6">

            {/* Free vs Paid comparison */}
            <div className="border border-gray-200 bg-white p-6">
              <h3 className="spec-label text-[9px] text-muted-foreground mb-4">WHAT YOU GET</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Eye size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Overall Score & Grade</p>
                    <p className="text-xs text-muted-foreground">0-100 score across 7 categories. See where you stand vs. your industry.</p>
                    <span className="spec-label text-[8px] text-[#059669] mt-1 inline-block">FREE</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Category Breakdown</p>
                    <p className="text-xs text-muted-foreground">Scores for Discoverability, Product Understanding, Cart & Checkout, and more.</p>
                    <span className="spec-label text-[8px] text-[#059669] mt-1 inline-block">FREE</span>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-2" />

                <div className="flex items-start gap-3 opacity-70">
                  <div className="w-7 h-7 bg-[#0259DD] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Full Findings & Action Plan</p>
                    <p className="text-xs text-muted-foreground">Every issue found, prioritized by impact, with exactly how to fix each one.</p>
                    <span className="spec-label text-[8px] text-[#0259DD] mt-1 inline-block">PRO PLAN — $149/MO</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-70">
                  <div className="w-7 h-7 bg-[#0259DD] flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Agent Journey Replays</p>
                    <p className="text-xs text-muted-foreground">Watch exactly where each AI agent got stuck on your site. Screenshots and step-by-step.</p>
                    <span className="spec-label text-[8px] text-[#0259DD] mt-1 inline-block">PRO PLAN — $149/MO</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-70">
                  <div className="w-7 h-7 bg-[#0259DD] flex items-center justify-center shrink-0 mt-0.5">
                    <Lock size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Weekly Monitoring & Alerts</p>
                    <p className="text-xs text-muted-foreground">Automated weekly rescans. Get alerted when your score changes or new issues appear.</p>
                    <span className="spec-label text-[8px] text-[#0259DD] mt-1 inline-block">PRO PLAN — $149/MO</span>
                  </div>
                </div>
              </div>

              <Link
                href="/pricing"
                className="block w-full py-2.5 border-2 border-[#0259DD] text-[#0259DD] text-sm font-bold hover:bg-[#0259DD] hover:text-white transition-colors text-center"
              >
                Compare Plans
              </Link>
            </div>

            {/* Social proof */}
            <div className="border border-gray-200 bg-[#FFF8F0] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="data-num text-2xl font-black text-foreground">1,000+</span>
                <span className="text-sm text-muted-foreground">brands already tracked</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We scan daily across fashion, electronics, beauty, home, DTC, luxury, and more.
                Your brand will join the index alongside Nike, Glossier, Allbirds, Samsung, and others.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

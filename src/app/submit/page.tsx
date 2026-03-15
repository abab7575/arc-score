"use client";

import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CheckCircle2, Send } from "lucide-react";
import { CATEGORY_LABELS, type BrandCategory } from "@/lib/brands";

const categories: BrandCategory[] = [
  "fashion", "electronics", "home", "beauty", "grocery", "general", "dtc", "luxury", "sports",
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
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Submit Your Site
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Want to see your brand on the Robot Shopper index? Submit it here and we&apos;ll add it to our daily scanning queue.
        </p>

        {submitted ? (
          <div className="card-soft rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll review your submission and add it to the index. No immediate scan is triggered — your brand will appear after our next scan cycle.
            </p>
          </div>
        ) : (
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
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6648] focus:border-transparent"
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
                placeholder="https://www.nike.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6648] focus:border-transparent"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Include https:// — e.g. https://www.nike.com
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Product URL (optional)
              </label>
              <input
                type="url"
                value={form.productUrl}
                onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                placeholder="https://www.nike.com/t/some-shoe-..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6648] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6648] focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email (optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6648] focus:border-transparent"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                We&apos;ll notify you when your brand is added.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: submitting ? "#e85a3f" : "#FF6648" }}
              onMouseEnter={(e) => { if (!submitting) (e.currentTarget.style.backgroundColor = "#e85a3f"); }}
              onMouseLeave={(e) => { if (!submitting) (e.currentTarget.style.backgroundColor = "#FF6648"); }}
            >
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit Brand"}
            </button>
          </form>
        )}

        {/* What happens next */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h3 className="spec-label text-xs tracking-widest uppercase text-muted-foreground mb-4">
            What happens next
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: "01", text: "We review your submission" },
              { n: "02", text: "Your brand enters our scanning queue" },
              { n: "03", text: "Score appears on the index within 48 hours" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <span className="data-num text-lg font-bold" style={{ color: "#FF6648" }}>
                  {step.n}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

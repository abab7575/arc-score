"use client";

import Link from "next/link";
import { Database, Shield, Globe } from "lucide-react";

export function IndexHero({ brandCount }: { brandCount?: number }) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: "#FFF8F0" }}>
      {/* Retro grid */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,102,72,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,89,221,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Accent dots */}
      <div className="absolute bottom-16 left-[10%] w-3.5 h-3.5 rounded-full bg-[#FF6648] z-[1]" style={{ boxShadow: "0 0 12px rgba(255,102,72,0.4)" }} />
      <div className="absolute top-24 right-[18%] w-3 h-3 rounded-full bg-[#FBBA16] z-[1]" style={{ boxShadow: "0 0 10px rgba(251,186,22,0.4)" }} />
      <div className="absolute bottom-32 right-[8%] w-2 h-2 rounded-full bg-[#0259DD] z-[1]" style={{ boxShadow: "0 0 8px rgba(2,89,221,0.3)" }} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          {/* Spec label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="spec-label text-[10px] text-[#FF6648] tracking-widest uppercase">
              Updated Daily
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1628] tracking-tight leading-tight mb-4">
            Agent access intelligence for<br />
            <span className="text-[#0259DD]">{brandCount ? `${brandCount.toLocaleString()}+` : "1,000+"} commerce sites.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#0A1628]/60 max-w-2xl mx-auto mb-3">
            Which sites accept which agents. Which platforms they run on. What they publish.
            What&apos;s changing. Scanned daily, published publicly.
          </p>

          <p className="text-sm text-[#0A1628]/40 max-w-xl mx-auto mb-8 font-mono">
            {brandCount ? brandCount.toLocaleString() : "1,000+"} brands &middot; 9 agents tested &middot; updated every 24h
          </p>

          {/* Signal badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {[
              { icon: Shield, label: "AI agent access rules", color: "#FF6648" },
              { icon: Globe, label: "Live access testing", color: "#0259DD" },
              { icon: Database, label: "Product data quality", color: "#059669" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 text-sm"
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[#0A1628]/70">{label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/matrix"
              className="text-sm font-bold text-white bg-[#0259DD] hover:bg-[#0247b5] px-6 py-3 transition-colors relative group/btn"
            >
              Browse the index
              <span className="absolute inset-0 bg-[#0A1628] -z-10 translate-x-[2px] translate-y-[2px] group-hover/btn:translate-x-[3px] group-hover/btn:translate-y-[3px] transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-[#0A1628] border-2 border-[#0A1628] px-6 py-2.5 hover:bg-[#0A1628] hover:text-white transition-colors"
            >
              API &amp; history
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

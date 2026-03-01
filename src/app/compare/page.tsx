"use client";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BrandCompareModule } from "@/components/compare/brand-compare-module";

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="hero-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Compare Brands
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Side-by-side comparison of agent commerce readiness. See how brands
            stack up across ACP support, checkout APIs, structured data, and
            more.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 -mt-1">
        <BrandCompareModule />
      </main>

      <Footer />
    </div>
  );
}

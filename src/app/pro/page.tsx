import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata = {
  title: "Pro — ARC Report",
  description:
    "The ARC Report public index is free. Paid plans for historical data, exports, and higher-rate API access are coming soon.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            The index is free. Pro adds depth.
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Every brand, every signal, every day — free, no account, CC BY 4.0.
            Pro exists for teams that need more history and higher limits, and
            it funds the public dataset.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="border-2 border-gray-200 bg-white p-7">
            <h2 className="text-lg font-bold text-foreground mb-1">Public Index</h2>
            <p className="text-sm text-muted-foreground mb-5">Free, forever</p>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• 1,000+ brands scanned daily</li>
              <li>• Full agent access matrix</li>
              <li>• Per-brand signal readouts</li>
              <li>• Daily changelog feed</li>
              <li>• Public read API</li>
            </ul>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-bold text-white bg-[#0259DD] hover:bg-[#024bb5] px-5 py-2.5 transition-colors"
            >
              Browse the index →
            </Link>
          </div>

          <div className="border-2 border-dashed border-gray-300 bg-gray-50/40 p-7">
            <h2 className="text-lg font-bold text-foreground mb-1">
              Pro <span className="text-xs font-mono text-[#FF6648] ml-1">SOON</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-5">Historical depth, API, exports</p>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• Full multi-year changelog history</li>
              <li>• CSV + JSON exports</li>
              <li>• Higher-rate API access</li>
              <li>• Saved filters with email alerts</li>
              <li>• Quarterly industry reports</li>
            </ul>
            <a
              href="mailto:hello@arcreport.ai?subject=ARC%20Pro%20early%20access"
              className="mt-6 inline-block text-sm font-bold text-foreground border-2 border-foreground hover:bg-foreground hover:text-white px-5 py-2.5 transition-colors"
            >
              Request early access
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Questions? <a href="mailto:hello@arcreport.ai" className="text-[#0259DD] hover:underline">hello@arcreport.ai</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}

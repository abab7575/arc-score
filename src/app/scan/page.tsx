import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ScanWidget } from "@/components/scan/scan-widget";
import { getIndexStats } from "@/lib/index-data";
import { TRACKED_AGENT_COUNT } from "@/lib/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan Any Site — Free AI Agent Access Check | ARC Report",
  description:
    "Check any e-commerce domain's AI agent access for free: robots.txt policy for 9 agents, live HTTP tests, structured data, llms.txt, and an ARC Score. No signup.",
};

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  const stats = getIndexStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <div className="spec-label text-muted-foreground mb-2">INSTANT SCAN · FREE</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Scan any site for AI agent access
          </h1>
          <p className="text-base text-muted-foreground">
            The same scan that builds the {stats.brandCount.toLocaleString()}-brand index, on
            demand: robots.txt rules for {TRACKED_AGENT_COUNT} AI agents, live HTTP access tests,
            structured data, platform detection, and protocol files — scored 0–100.
          </p>
        </div>

        <ScanWidget defaultDomain={domain} />

        <div className="mt-12 border-t border-gray-200 pt-6 text-sm text-muted-foreground">
          Already tracked? Brands in the index open instantly with full history:{" "}
          <Link href="/" className="text-[#0259DD] hover:underline">browse the index</Link>,{" "}
          <Link href="/matrix" className="text-[#0259DD] hover:underline">see the matrix</Link>, or{" "}
          <Link href="/methodology" className="text-[#0259DD] hover:underline">read the methodology</Link>.
        </div>
      </main>
      <Footer />
    </div>
  );
}

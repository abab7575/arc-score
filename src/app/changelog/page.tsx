"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import Link from "next/link";
import { Lock, Info } from "lucide-react";

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex items-center gap-1 cursor-help">
      {children}
      <Info className="w-3 h-3 text-muted-foreground/40 group-hover/tip:text-[#0259DD] transition-colors inline" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0A1628] text-white text-[11px] font-normal leading-relaxed p-2.5 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none group-hover/tip:pointer-events-auto">
        {text}
        <span className="block mt-1.5"><Link href="/landscape" className="text-[#84AFFB] hover:text-white text-[10px] font-semibold uppercase tracking-wider">Learn more →</Link></span>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A1628] rotate-45" />
      </span>
    </span>
  );
}

interface ChangelogEntry {
  id: number;
  brandId: number;
  brandSlug: string;
  brandName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
}

const FIELD_INFO: Record<string, { label: string; tooltip: string }> = {
  platform: { label: "Platform", tooltip: "The e-commerce platform powering the site (Shopify, Magento, etc)." },
  cdn: { label: "CDN", tooltip: "Content Delivery Network — the infrastructure serving the site's content globally." },
  waf: { label: "WAF", tooltip: "Web Application Firewall — security layer that can block AI agents even if robots.txt allows them." },
  blocked_agent_count: { label: "Blocked Agents", tooltip: "The number of AI shopping agents (out of 8) that are blocked from accessing this site." },
  json_ld: { label: "JSON-LD", tooltip: "Structured data markup that helps AI agents understand products, prices, and availability on the page." },
  schema_product: { label: "Schema Product", tooltip: "Schema.org Product markup — the standard way to describe products so machines can read them." },
  open_graph: { label: "Open Graph", tooltip: "Meta tags used by social platforms and AI agents to understand page content (title, image, description)." },
  product_feed: { label: "Product Feed", tooltip: "A machine-readable file listing all products (Google Shopping, Shopify JSON, etc). Essential for feed-based AI agents." },
  llms_txt: { label: "llms.txt", tooltip: "A file that tells AI language models what the site is about and how to interact with it. A new standard." },
  ucp: { label: "UCP", tooltip: "Universal Commerce Protocol — an emerging standard for AI agents to interact with e-commerce sites programmatically." },
};

const VALUE_TOOLTIPS: Record<string, string> = {
  allowed: "The site explicitly permits this AI agent to access its content.",
  blocked: "The site blocks this AI agent — either via robots.txt or by detecting and rejecting its requests.",
  no_rule: "The site's robots.txt doesn't mention this agent. By default, access is allowed but not guaranteed.",
  unknown: "We couldn't determine access status — the site may have timed out or returned an unexpected response.",
  "none-detected": "No WAF or bot protection system was detected on this site.",
};

function formatField(field: string): React.ReactNode {
  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    return (
      <Tooltip text={`Whether the AI agent "${agent}" can access this site. Determined by robots.txt rules and real HTTP access testing.`}>
        <span>{agent} access</span>
      </Tooltip>
    );
  }
  const info = FIELD_INFO[field];
  if (info) {
    return (
      <Tooltip text={info.tooltip}>
        <span>{info.label}</span>
      </Tooltip>
    );
  }
  return field;
}

function formatValue(value: string | null): React.ReactNode {
  if (value === null) return "none";
  if (value === "true" || value === "1") return "detected";
  if (value === "false" || value === "0") return "not detected";

  const tip = VALUE_TOOLTIPS[value];
  if (tip) {
    return (
      <Tooltip text={tip}>
        <span>{value}</span>
      </Tooltip>
    );
  }
  return value;
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries ?? []);
        setIsPro(data.isPro ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by date
  const grouped = entries.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    const date = entry.detectedAt.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
            Changelog
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily changes detected across all tracked brands. What shifted in the agentic commerce landscape?
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Loading changelog...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No changes detected yet. Run the daily scan to start tracking.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, dateEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="spec-label text-xs text-muted-foreground">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{dateEntries.length} change{dateEntries.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-2">
                  {dateEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/brand/${entry.brandSlug}`}
                          className="font-medium text-sm text-foreground hover:text-[#0259DD] transition-colors"
                        >
                          {entry.brandName}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{formatField(entry.field)}</span>
                          {" changed from "}
                          <span className="font-mono text-xs bg-red-50 text-red-700 px-1 py-0.5">{formatValue(entry.oldValue)}</span>
                          {" to "}
                          <span className="font-mono text-xs bg-green-50 text-green-700 px-1 py-0.5">{formatValue(entry.newValue)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pro upsell */}
            {!isPro && (
              <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-8 text-center">
                <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  Showing the 5 most recent changes
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro for the full changelog with filtering and search.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-5 py-2 transition-colors"
                >
                  Get Pro — $100/mo
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

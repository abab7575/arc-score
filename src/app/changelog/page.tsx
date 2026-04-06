"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import Link from "next/link";
import { Lock, Info, LinkIcon } from "lucide-react";

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex items-center gap-1 cursor-help">
      {children}
      <Info className="w-3 h-3 text-muted-foreground/40 group-hover/tip:text-[#0259DD] transition-colors inline" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 w-56 z-50 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all">
        <span className="block bg-[#0A1628] text-white text-[11px] font-normal leading-relaxed p-2.5 relative">
          {text}
          <span className="block mt-1.5"><Link href="/landscape" className="text-[#84AFFB] hover:text-white text-[10px] font-semibold uppercase tracking-wider">Learn more →</Link></span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A1628] rotate-45" />
        </span>
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
  blocked_agent_count: { label: "Blocked Agents", tooltip: "The number of AI shopping agents (out of 9) that are blocked from accessing this site." },
  json_ld: { label: "JSON-LD", tooltip: "Structured data markup that helps AI agents understand products, prices, and availability on the page." },
  schema_product: { label: "Schema Product", tooltip: "Schema.org Product markup — the standard way to describe products so machines can read them." },
  open_graph: { label: "Open Graph", tooltip: "Meta tags used by social platforms and AI agents to understand page content (title, image, description)." },
  product_feed: { label: "Product Feed", tooltip: "A machine-readable file listing all products (Google Shopping, Shopify JSON, etc). Essential for feed-based AI agents." },
  llms_txt: { label: "llms.txt", tooltip: "A file that tells AI language models what the site is about and how to interact with it. A new standard." },
  ucp: { label: "UCP", tooltip: "Universal Commerce Protocol — an emerging standard for AI agents to interact with e-commerce sites programmatically." },
  sitemap: { label: "Sitemap", tooltip: "Whether the site has a sitemap.xml that helps crawlers discover pages." },
  agents_txt: { label: "agents.txt", tooltip: "An agent declaration file that tells AI agents what the site supports." },
};

const VALUE_TOOLTIPS: Record<string, string> = {
  allowed: "This brand's robots.txt explicitly permits this AI agent to access their site.",
  blocked: "This brand's robots.txt explicitly tells this AI agent not to access their site.",
  no_rule: "This brand's robots.txt does not mention this AI agent. By web convention, access is allowed by default.",
  restricted: "Our test request was blocked or challenged, likely by the site's security system (WAF), not by a specific AI agent policy.",
  inconclusive: "We could not get a clear result on this scan. This can happen due to timeouts or temporary issues. We will retry on the next scan.",
  unknown: "We couldn't determine access status — the site may have timed out or returned an unexpected response.",
  "none-detected": "No WAF or bot protection system was detected on this site.",
};

type ConfidenceLevel = "high" | "medium" | "low";

const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; color: string; tooltip: string }> = {
  high: {
    label: "high confidence",
    color: "text-[#059669]",
    tooltip: "High confidence — based on direct file parsing or verified HTTP responses.",
  },
  medium: {
    label: "medium confidence",
    color: "text-[#FBBA16]",
    tooltip: "Medium confidence — based on HTTP testing which can be affected by security systems.",
  },
  low: {
    label: "low confidence",
    color: "text-[#FF6648]",
    tooltip: "Low confidence — based on HTML source analysis. JavaScript-rendered content may not be detected.",
  },
};

function getFieldConfidence(field: string): ConfidenceLevel {
  // robots.txt per-agent fields → high
  if (field.startsWith("agent_access_")) return "high";
  // platform detection for major platforms → high
  if (field === "platform") return "high";
  // HTTP-based tests → medium
  if (field === "blocked_agent_count") return "medium";
  if (field === "cdn") return "medium";
  if (field === "waf") return "medium";
  // Structured data detection → low (misses JS-rendered content)
  if (field === "json_ld") return "low";
  if (field === "schema_product") return "low";
  if (field === "open_graph") return "low";
  if (field === "product_feed") return "low";
  if (field === "llms_txt") return "low";
  if (field === "ucp") return "low";
  // Default to medium for unknown fields
  return "medium";
}

function ConfidenceBadge({ field }: { field: string }) {
  const level = getFieldConfidence(field);
  const meta = CONFIDENCE_META[level];
  return (
    <span className="relative group/conf inline-flex items-center ml-1.5 cursor-help">
      <span className={`text-[10px] font-mono ${meta.color} opacity-60 group-hover/conf:opacity-100 transition-opacity`}>
        ({meta.label})
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 w-56 z-50 opacity-0 invisible group-hover/conf:opacity-100 group-hover/conf:visible transition-all">
        <span className="block bg-[#0A1628] text-white text-[11px] font-normal leading-relaxed p-2.5 relative">
          {meta.tooltip}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A1628] rotate-45" />
        </span>
      </span>
    </span>
  );
}

function formatField(field: string): React.ReactNode {
  // Handle "agent_access_GPTBot" format
  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    return (
      <Tooltip text={`Whether the AI agent "${agent}" can access this site. Determined by robots.txt rules and real HTTP access testing.`}>
        <span>{agent} access</span>
      </Tooltip>
    );
  }
  // Handle "agent_ua_GPTBot" format (UA HTTP test results)
  if (field.startsWith("agent_ua_")) {
    const agent = field.replace("agent_ua_", "");
    return (
      <Tooltip text={`HTTP access test result for "${agent}". Whether the site actually serves content to this agent's user-agent string.`}>
        <span>{agent} HTTP access</span>
      </Tooltip>
    );
  }
  // Handle "GPTBot robots.txt" format (per-agent robots.txt rules)
  if (field.endsWith(" robots.txt")) {
    const agent = field.replace(" robots.txt", "");
    return (
      <Tooltip text={`The robots.txt rule for "${agent}". Whether the site's robots.txt explicitly allows or blocks this agent.`}>
        <span>{agent} robots.txt</span>
      </Tooltip>
    );
  }
  // Handle "robots.txt presence"
  if (field === "robots.txt presence") {
    return (
      <Tooltip text="Whether the site has a robots.txt file. Sites without one are open to all crawlers by default.">
        <span>robots.txt presence</span>
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
            {(() => {
              let runningIndex = 0;
              const FREE_VISIBLE_LIMIT = 3;
              return Object.entries(grouped).map(([date, dateEntries]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="spec-label text-xs text-muted-foreground">{date}</span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{dateEntries.length} change{dateEntries.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="space-y-2">
                    {dateEntries.map(entry => {
                      runningIndex++;
                      const isBlurred = !isPro && runningIndex > FREE_VISIBLE_LIMIT;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 border border-gray-200 bg-white px-4 py-3 group/entry hover:border-[#0259DD] transition-colors relative ${isBlurred ? "select-none" : ""}`}
                        >
                          {isBlurred && (
                            <div className="absolute inset-0 backdrop-blur-[6px] bg-white/60 z-10" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/brand/${entry.brandSlug}`}
                                className="font-medium text-sm text-foreground hover:text-[#0259DD] transition-colors"
                              >
                                {entry.brandName}
                              </Link>
                              <Link
                                href={`/changelog/${entry.id}`}
                                className="opacity-0 group-hover/entry:opacity-100 transition-opacity text-muted-foreground hover:text-[#0259DD]"
                                title="Shareable link"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <Link href={`/changelog/${entry.id}`} className="block mt-0.5">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{formatField(entry.field)}</span>
                                {" changed from "}
                                <span className="font-mono text-xs bg-red-50 text-red-700 px-1 py-0.5">{formatValue(entry.oldValue)}</span>
                                {" to "}
                                <span className="font-mono text-xs bg-green-50 text-green-700 px-1 py-0.5">{formatValue(entry.newValue)}</span>
                                <ConfidenceBadge field={entry.field} />
                              </p>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Pro upsell */}
            {!isPro && entries.length > 3 && (
              <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-8 text-center">
                <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  Full history is blurred
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro for the full changelog — 90+ days of history, exports, and daily alerts.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-5 py-2 transition-colors"
                >
                  Upgrade for full history — $149/mo
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

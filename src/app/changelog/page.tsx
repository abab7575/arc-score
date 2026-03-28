"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import Link from "next/link";
import { Lock } from "lucide-react";

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

const FIELD_LABELS: Record<string, string> = {
  platform: "Platform",
  cdn: "CDN",
  waf: "WAF",
  blocked_agent_count: "Blocked Agents",
  json_ld: "JSON-LD",
  schema_product: "Schema Product",
  open_graph: "Open Graph",
  product_feed: "Product Feed",
  llms_txt: "llms.txt",
  ucp: "UCP",
};

function formatField(field: string): string {
  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    return `${agent} access`;
  }
  return FIELD_LABELS[field] ?? field;
}

function formatValue(value: string | null): string {
  if (value === null) return "none";
  if (value === "true" || value === "1") return "detected";
  if (value === "false" || value === "0") return "not detected";
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

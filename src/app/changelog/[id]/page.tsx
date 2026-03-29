import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { db, schema } from "@/lib/db/index";
import { eq, desc, and, ne } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calendar, Shield, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

// ── Field & value display helpers (mirrored from changelog page) ────

const FIELD_INFO: Record<string, { label: string; description: string }> = {
  platform: { label: "Platform", description: "The e-commerce platform powering the site (Shopify, Magento, etc)." },
  cdn: { label: "CDN", description: "Content Delivery Network — the infrastructure serving the site's content globally." },
  waf: { label: "WAF", description: "Web Application Firewall — security layer that can block AI agents even if robots.txt allows them." },
  blocked_agent_count: { label: "Blocked Agents", description: "The number of AI shopping agents (out of 8) that are blocked from accessing this site." },
  json_ld: { label: "JSON-LD", description: "Structured data markup that helps AI agents understand products, prices, and availability." },
  schema_product: { label: "Schema Product", description: "Schema.org Product markup — the standard way to describe products so machines can read them." },
  open_graph: { label: "Open Graph", description: "Meta tags used by social platforms and AI agents to understand page content." },
  product_feed: { label: "Product Feed", description: "A machine-readable file listing all products (Google Shopping, Shopify JSON, etc)." },
  llms_txt: { label: "llms.txt", description: "A file that tells AI language models what the site is about and how to interact with it." },
  ucp: { label: "UCP", description: "Universal Commerce Protocol — an emerging standard for AI agents to interact with e-commerce sites." },
};

type ConfidenceLevel = "high" | "medium" | "low";

const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; bg: string; text: string; description: string }> = {
  high: {
    label: "High Confidence",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    description: "Based on direct file parsing or verified HTTP responses.",
  },
  medium: {
    label: "Medium Confidence",
    bg: "bg-amber-50",
    text: "text-amber-700",
    description: "Based on HTTP testing which can be affected by security systems.",
  },
  low: {
    label: "Low Confidence",
    bg: "bg-red-50",
    text: "text-red-600",
    description: "Based on HTML source analysis. JavaScript-rendered content may not be detected.",
  },
};

function getFieldConfidence(field: string): ConfidenceLevel {
  if (field.startsWith("agent_access_")) return "high";
  if (field === "platform") return "high";
  if (field === "blocked_agent_count") return "medium";
  if (field === "cdn") return "medium";
  if (field === "waf") return "medium";
  if (field === "json_ld") return "low";
  if (field === "schema_product") return "low";
  if (field === "open_graph") return "low";
  if (field === "product_feed") return "low";
  if (field === "llms_txt") return "low";
  if (field === "ucp") return "low";
  return "medium";
}

function formatFieldLabel(field: string): string {
  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    return `${agent} Access`;
  }
  return FIELD_INFO[field]?.label ?? field;
}

function getFieldDescription(field: string): string {
  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    return `Whether the AI agent "${agent}" can access this site, determined by robots.txt rules and real HTTP access testing.`;
  }
  return FIELD_INFO[field]?.description ?? "A tracked property of this brand's AI agent accessibility.";
}

function formatDisplayValue(value: string | null): string {
  if (value === null) return "none";
  if (value === "true" || value === "1") return "detected";
  if (value === "false" || value === "0") return "not detected";
  return value;
}

function getChangeSummary(field: string, oldValue: string | null, newValue: string | null, brandName: string): string {
  const fieldLabel = formatFieldLabel(field);
  const oldDisplay = formatDisplayValue(oldValue);
  const newDisplay = formatDisplayValue(newValue);

  if (field.startsWith("agent_access_")) {
    const agent = field.replace("agent_access_", "");
    if (newDisplay === "blocked") {
      return `${brandName} is now blocking ${agent} from accessing their site.`;
    }
    if (newDisplay === "allowed" && oldDisplay === "blocked") {
      return `${brandName} has unblocked ${agent}, allowing the AI agent to access their site again.`;
    }
    if (newDisplay === "restricted") {
      return `${brandName}'s security system is now restricting ${agent} access, even though their robots.txt may not explicitly block it.`;
    }
    return `${brandName}'s ${agent} access status changed from ${oldDisplay} to ${newDisplay}.`;
  }

  if (field === "blocked_agent_count") {
    const oldNum = parseInt(oldDisplay) || 0;
    const newNum = parseInt(newDisplay) || 0;
    if (newNum > oldNum) {
      return `${brandName} is now blocking ${newNum} AI agents, up from ${oldNum}. This means fewer AI shopping assistants can access their products.`;
    }
    return `${brandName} reduced their blocked agent count from ${oldNum} to ${newNum}, opening up to more AI shopping agents.`;
  }

  if (field === "waf") {
    if (newDisplay === "none-detected") {
      return `${brandName} appears to have removed their Web Application Firewall, which may make it easier for AI agents to access their site.`;
    }
    return `${brandName} changed their WAF to ${newDisplay}. This security layer can affect whether AI agents can reach the site.`;
  }

  return `${brandName}'s ${fieldLabel.toLowerCase()} changed from ${oldDisplay} to ${newDisplay}.`;
}

// ── Data fetching ───────────────────────────────────────────────────

function getEntry(id: number) {
  return db
    .select()
    .from(schema.changelogEntries)
    .where(eq(schema.changelogEntries.id, id))
    .get();
}

function getBrand(brandId: number) {
  return db
    .select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name, url: schema.brands.url })
    .from(schema.brands)
    .where(eq(schema.brands.id, brandId))
    .get();
}

function getRelatedEntries(entryId: number, brandId: number, field: string, limit: number = 5) {
  // Get recent entries for the same brand or same field, excluding the current entry
  const sameBrand = db
    .select({
      id: schema.changelogEntries.id,
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
    })
    .from(schema.changelogEntries)
    .where(
      and(
        eq(schema.changelogEntries.brandId, brandId),
        ne(schema.changelogEntries.id, entryId),
      )
    )
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(limit)
    .all();

  // Get brand info for enrichment
  const brandIds = [...new Set(sameBrand.map(e => e.brandId))];
  const brands = db.select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name }).from(schema.brands).all();
  const brandMap = new Map(brands.map(b => [b.id, b]));

  return sameBrand.map(e => ({
    ...e,
    brandSlug: brandMap.get(e.brandId)?.slug ?? "unknown",
    brandName: brandMap.get(e.brandId)?.name ?? "Unknown",
  }));
}

// ── Metadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entryId = parseInt(id);
  if (isNaN(entryId)) return { title: "Change Not Found | ARC Report" };

  const entry = getEntry(entryId);
  if (!entry) return { title: "Change Not Found | ARC Report" };

  const brand = getBrand(entry.brandId);
  const brandName = brand?.name ?? "Unknown";
  const fieldLabel = formatFieldLabel(entry.field);
  const oldDisplay = formatDisplayValue(entry.oldValue);
  const newDisplay = formatDisplayValue(entry.newValue);
  const date = entry.detectedAt.split("T")[0];

  const title = `${brandName} changed ${fieldLabel}: ${oldDisplay} \u2192 ${newDisplay} | ARC Report`;
  const description = `${brandName}'s AI agent access policy changed on ${date}. ${getChangeSummary(entry.field, entry.oldValue, entry.newValue, brandName)} Track AI agent access for 1,000+ brands at arcreport.ai.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "ARC Report",
      url: `https://arcreport.ai/changelog/${entryId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── Page Component ──────────────────────────────────────────────────

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { id } = await params;
  const entryId = parseInt(id);
  if (isNaN(entryId)) notFound();

  const entry = getEntry(entryId);
  if (!entry) notFound();

  const brand = getBrand(entry.brandId);
  const brandName = brand?.name ?? "Unknown";
  const brandSlug = brand?.slug ?? "unknown";

  const fieldLabel = formatFieldLabel(entry.field);
  const fieldDescription = getFieldDescription(entry.field);
  const oldDisplay = formatDisplayValue(entry.oldValue);
  const newDisplay = formatDisplayValue(entry.newValue);
  const confidence = getFieldConfidence(entry.field);
  const confidenceMeta = CONFIDENCE_META[confidence];
  const changeSummary = getChangeSummary(entry.field, entry.oldValue, entry.newValue, brandName);

  const date = new Date(entry.detectedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const relatedEntries = getRelatedEntries(entryId, entry.brandId, entry.field);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link href="/changelog" className="hover:text-foreground transition-colors">
            Changelog
          </Link>
          <span>/</span>
          <span className="text-foreground">{brandName}</span>
        </nav>

        {/* Main change card */}
        <article className="border-2 border-[#0A1628] bg-white relative">
          {/* Top accent stripe */}
          <div className="flex h-1.5">
            <div className="flex-1 bg-[#0259DD]" />
            <div className="flex-1 bg-[#FF6648]" />
            <div className="flex-1 bg-[#FBBA16]" />
          </div>

          <div className="p-6 sm:p-8">
            {/* Brand name + date */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <Link
                  href={`/brand/${brandSlug}`}
                  className="text-xl font-black text-foreground hover:text-[#0259DD] transition-colors"
                >
                  {brandName}
                </Link>
                {brand?.url && (
                  <a
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#0259DD] mt-0.5 transition-colors"
                  >
                    {brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                <span>{date}</span>
              </div>
            </div>

            {/* What changed */}
            <div className="mb-6">
              <p className="spec-label text-[10px] text-muted-foreground mb-2">WHAT CHANGED</p>
              <p className="text-sm font-semibold text-foreground mb-1">
                {fieldLabel}
              </p>
              <p className="text-xs text-muted-foreground">{fieldDescription}</p>
            </div>

            {/* Old → New */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="spec-label text-[10px] text-muted-foreground">FROM</span>
                <span className="font-mono text-sm bg-red-50 text-red-700 border border-red-200 px-2.5 py-1">
                  {oldDisplay}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2">
                <span className="spec-label text-[10px] text-muted-foreground">TO</span>
                <span className="font-mono text-sm bg-green-50 text-green-700 border border-green-200 px-2.5 py-1">
                  {newDisplay}
                </span>
              </div>
            </div>

            {/* Confidence badge */}
            <div className="flex items-start gap-2 mb-6">
              <Shield className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 ${confidenceMeta.bg} ${confidenceMeta.text}`}>
                  {confidenceMeta.label}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{confidenceMeta.description}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 pt-5">
              <p className="spec-label text-[10px] text-muted-foreground mb-2">WHAT THIS MEANS</p>
              <p className="text-sm text-foreground leading-relaxed">
                {changeSummary}
              </p>
            </div>
          </div>
        </article>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Link
            href={`/brand/${brandSlug}`}
            className="flex items-center justify-between bg-[#0259DD] text-white px-5 py-3.5 text-sm font-bold hover:bg-[#024bc2] transition-colors group"
          >
            <span>Full report for {brandName}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/pricing"
            className="flex items-center justify-between bg-[#FF6648] text-white px-5 py-3.5 text-sm font-bold hover:bg-[#e85a3f] transition-colors group"
          >
            <span>Track 1,000+ brands daily</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Related changes */}
        {relatedEntries.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Recent changes for {brandName}
            </h2>
            <div className="space-y-2">
              {relatedEntries.map(related => (
                <Link
                  key={related.id}
                  href={`/changelog/${related.id}`}
                  className="flex items-start gap-3 border border-gray-200 bg-white px-4 py-3 hover:border-[#0259DD] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground group-hover:text-[#0259DD] transition-colors">
                        {formatFieldLabel(related.field)}
                      </span>
                      {" changed from "}
                      <span className="font-mono text-xs bg-red-50 text-red-700 px-1 py-0.5">
                        {formatDisplayValue(related.oldValue)}
                      </span>
                      {" to "}
                      <span className="font-mono text-xs bg-green-50 text-green-700 px-1 py-0.5">
                        {formatDisplayValue(related.newValue)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {related.detectedAt.split("T")[0]}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#0259DD] shrink-0 mt-1 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to full changelog */}
        <div className="mt-8 text-center">
          <Link
            href="/changelog"
            className="text-sm text-muted-foreground hover:text-[#0259DD] transition-colors"
          >
            &larr; View full changelog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

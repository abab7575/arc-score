import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { runLightweightScan } from "@/lib/scanner/lightweight-scanner";
import { deriveAgentStatus } from "@/lib/db/queries";
import { resolveBrand } from "@/lib/mcp/tools";
import { computeArcScore, arcScoreLabel } from "@/lib/scoring/arc-score";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL, TRACKED_AGENT_IDS } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

/** Queue an unknown domain for review/inclusion in the daily index. */
function queueForIndex(domain: string) {
  const url = `https://${domain}`;
  const existing = db
    .select({ id: schema.submissions.id })
    .from(schema.submissions)
    .where(eq(schema.submissions.url, url))
    .get();
  if (!existing) {
    db.insert(schema.submissions)
      .values({ brandName: domain, url, category: "instant-scan" })
      .run();
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body: { \"domain\": \"example.com\" }" }, { status: 400 });
  }
  const domain = normalize(body.domain ?? "");
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      { error: `"${body.domain ?? ""}" doesn't look like a domain. Try something like allbirds.com.` },
      { status: 400 },
    );
  }

  // Known brand? Free, no rate-limit cost — just point at the live page.
  const { brand } = resolveBrand(domain);
  if (brand) {
    return NextResponse.json({ known: true, slug: brand.slug, name: brand.name });
  }

  // On-demand scans are the expensive path: 5 per IP per day.
  const rl = rateLimit(`scan:${ip}`, 5, 24 * 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      {
        error:
          "You've used today's 5 free instant scans. Every domain you scanned is queued for the daily index, so check back tomorrow — or browse the 1,000+ brands already tracked.",
        rateLimited: true,
      },
      { status: 429 },
    );
  }

  try {
    const result = await runLightweightScan(domain);
    const agentStatus = deriveAgentStatus(result);

    const scanLike = {
      agentStatusJson: JSON.stringify(agentStatus),
      hasJsonLd: result.jsonLd.found,
      hasSchemaProduct: result.schemaOrg.found,
      hasOpenGraph: result.openGraph.found,
      hasSitemap: result.sitemap.found,
      hasProductFeed: result.feeds.some((f) => f.found),
      hasLlmsTxt: result.llmsTxt.found,
      llmsTxtLinkCount: result.llmsTxt.linkCount,
      hasAgentsTxt: result.agentsTxt.found,
      hasUcp: result.ucpFile.found,
    };
    const score = computeArcScore(scanLike);

    queueForIndex(domain);

    return NextResponse.json({
      known: false,
      domain,
      url: `https://${domain}`,
      agentStatus: Object.fromEntries(
        TRACKED_AGENT_IDS.map((a) => [a, agentStatus[a] ?? "inconclusive"]),
      ),
      platform: result.platform.platform,
      cdn: result.cdn.cdn,
      waf: result.waf.waf,
      signals: {
        jsonLd: scanLike.hasJsonLd,
        schemaProduct: scanLike.hasSchemaProduct,
        openGraph: scanLike.hasOpenGraph,
        sitemap: scanLike.hasSitemap,
        productFeed: scanLike.hasProductFeed,
        llmsTxt: scanLike.hasLlmsTxt,
        agentsTxt: scanLike.hasAgentsTxt,
        ucp: scanLike.hasUcp,
      },
      arcScore: score.total,
      arcScoreLabel: arcScoreLabel(score.total).label,
      arcScoreComponents: {
        agentAccess: score.agentAccess,
        structuredData: score.structuredData,
        protocolFiles: score.protocolFiles,
        scanStability: score.scanStability,
      },
      scannedAt: new Date().toISOString(),
      scanDurationMs: result.scanDurationMs,
      queued: true,
      remainingToday: rl.remaining,
      source_url: `${SITE_URL}/scan`,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Couldn't scan ${domain} — the site may be unreachable or very slow. (${e instanceof Error ? e.message : "unknown error"})`,
      },
      { status: 502 },
    );
  }
}

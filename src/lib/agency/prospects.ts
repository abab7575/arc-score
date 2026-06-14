import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { insertLightweightScan } from "@/lib/db/queries";
import { runLightweightScan } from "@/lib/scanner/lightweight-scanner";
import { findContactAtDomain } from "@/lib/outreach/email-discovery";
import { SITE_URL } from "@/lib/site";
import {
  createPreview,
  findWorkspaceByDomain,
  getWorkspaceSites,
  normalizeDomain,
} from "./core";
import { assertPublicUrl } from "@/lib/security/network";

const NON_CLIENT_HOSTS = new Set([
  "facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com",
  "youtube.com", "vimeo.com", "github.com", "shopify.com", "wordpress.org",
  "behance.net", "dribbble.com", "clutch.co",
]);

function absoluteUrl(href: string, base: URL): URL | null {
  try { return new URL(href, base); } catch { return null; }
}

function extractMeta(html: string, base: URL) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)?.[1];
  const logoHref = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)/i)?.[1];
  const theme = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-f]{6})/i)?.[1];
  return {
    name: ogSite || title?.split(/[|–—-]/)[0]?.trim() || base.hostname,
    logoUrl: logoHref ? absoluteUrl(logoHref, base)?.toString() ?? null : null,
    primaryColor: theme || "#0259DD",
  };
}

function extractLinks(html: string, base: URL): URL[] {
  const urls: URL[] = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url && /^https?:$/.test(url.protocol)) urls.push(url);
  }
  return urls;
}

function likelyPortfolioPath(pathname: string): boolean {
  return /work|portfolio|case-stud|client|project|success-stor/i.test(pathname);
}

async function fetchHtml(url: string): Promise<string> {
  await assertPublicUrl(url);
  const response = await fetch(url, {
    headers: { "User-Agent": "ARCReport-AgencyDiscovery/1.0 (+https://arcreport.ai)" },
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

export async function discoverAgency(domainInput: string) {
  const domain = normalizeDomain(domainInput);
  const base = new URL(`https://${domain}`);
  const homepage = await fetchHtml(base.toString());
  const meta = extractMeta(homepage, base);
  const homeLinks = extractLinks(homepage, base);
  const internalPortfolio = [...new Set(
    homeLinks.filter((url) => url.hostname.replace(/^www\./, "") === domain && likelyPortfolioPath(url.pathname))
      .map((url) => url.toString()),
  )].slice(0, 12);

  const pages: Array<{ url: string; html: string }> = [{ url: base.toString(), html: homepage }];
  for (const url of internalPortfolio) {
    try { pages.push({ url, html: await fetchHtml(url) }); } catch { /* skip one bad case study */ }
  }

  const candidateMap = new Map<string, string>();
  for (const page of pages) {
    for (const url of extractLinks(page.html, new URL(page.url))) {
      const candidate = normalizeDomain(url.hostname);
      if (
        candidate !== domain &&
        !NON_CLIENT_HOSTS.has(candidate) &&
        !candidate.endsWith(`.${domain}`)
      ) {
        candidateMap.set(candidate, page.url);
      }
    }
  }

  let workspace = findWorkspaceByDomain(domain);
  if (!workspace) {
    workspace = db.insert(schema.agencyWorkspaces).values({
      name: meta.name,
      domain,
      logoUrl: meta.logoUrl,
      primaryColor: meta.primaryColor,
    }).returning().get();
  }

  const existing = new Set(getWorkspaceSites(workspace.id).map((site) => site.domain));
  const discovered: string[] = [];
  for (const [candidate, sourceUrl] of [...candidateMap].slice(0, 15)) {
    if (existing.has(candidate)) continue;
    let brand = db.select().from(schema.brands)
      .where(eq(schema.brands.url, `https://${candidate}`)).get();
    try {
      const result = await runLightweightScan(candidate);
      if (!["shopify", "woocommerce", "bigcommerce", "magento", "salesforce"].includes(result.platform.platform)
        && !result.schemaOrg.found && !result.feeds.some((feed) => feed.found)) {
        continue;
      }
      if (!brand) {
        const baseSlug = candidate.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-");
        let slug = baseSlug;
        let suffix = 2;
        while (db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.slug, slug)).get()) {
          slug = `${baseSlug}-${suffix++}`;
        }
        brand = db.insert(schema.brands).values({
          slug,
          name: candidate,
          url: `https://${candidate}`,
          category: "agency-portfolio",
        }).returning().get();
      }
      insertLightweightScan(brand.id, result);
      db.insert(schema.agencySites).values({
        workspaceId: workspace.id,
        brandId: brand.id,
        domain: candidate,
        name: brand.name,
        sourceUrl,
      }).run();
      discovered.push(candidate);
    } catch {
      // A failed or non-commerce candidate is not evidence and is omitted.
    }
    if (discovered.length >= 5) break;
  }

  if (getWorkspaceSites(workspace.id).length < 2) {
    return { workspace, discovered, preview: null, contact: null };
  }

  const { preview, token } = createPreview(workspace.id);
  const contactResult = await findContactAtDomain(domain);
  const contact = contactResult.found ? contactResult.contact : null;
  if (contact?.email && contact.confidence === "verified") {
    const previewUrl = `${SITE_URL}/preview/${token}`;
    const readouts = getWorkspaceSites(workspace.id).slice(0, 2);
    db.insert(schema.agencyCampaigns).values({
      workspaceId: workspace.id,
      previewId: preview.id,
      contactEmail: contact.email,
      contactName: contact.firstName,
      subject: `${workspace.name}: AI-commerce issues found across your client portfolio`,
      body: `Hi ${contact.firstName || "there"},

ARC scanned public storefronts from ${workspace.name}'s portfolio and found specific AI-shopping access and product-data issues across ${readouts.length} stores.

We prepared a private, co-branded preview with the evidence and implementation-ready fixes:
${previewUrl}

Arc for Agencies monitors up to 50 client stores, flags regressions, and produces reports your team can use with clients.

Andy
ARC Report`,
    }).run();
  }
  return { workspace, discovered, preview: { ...preview, token }, contact };
}

export async function importAgencySeedCsv(csv: string) {
  const rows = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const domains = rows
    .map((line) => line.split(",")[0])
    .map(normalizeDomain)
    .filter((domain, index, all) => domain.includes(".") && all.indexOf(domain) === index);
  const results = [];
  for (const domain of domains.slice(0, 100)) {
    try {
      results.push({ domain, ok: true, result: await discoverAgency(domain) });
    } catch (error) {
      results.push({ domain, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

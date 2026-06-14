import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { AGENCY_SESSION_COOKIE_NAME, readAgencySessionToken } from "@/lib/auth";
import { getBrandHistory, getLatestLightweightScan } from "@/lib/db/queries";
import { computeArcScore } from "@/lib/scoring/arc-score";
import { buildFixPrompts } from "@/lib/fix-prompts";
import { TRACKED_AGENT_IDS } from "@/lib/site";

export const AGENCY_SITE_LIMIT = 50;
export const PREVIEW_TTL_DAYS = 30;
export const FRESH_SCAN_HOURS = 72;

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function recordAgencyEvent(
  workspaceId: number,
  eventType: string,
  metadata: Record<string, unknown> = {},
  previewId?: number,
) {
  db.insert(schema.agencyEvents).values({
    workspaceId,
    previewId,
    eventType,
    metadataJson: JSON.stringify(metadata),
  }).run();
}

export async function getAgencySession() {
  const token = (await cookies()).get(AGENCY_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await readAgencySessionToken(token);
  if (!session) return null;
  const workspace = db.select().from(schema.agencyWorkspaces)
    .where(and(
      eq(schema.agencyWorkspaces.id, session.workspaceId),
      eq(schema.agencyWorkspaces.customerId, session.customerId),
    )).get();
  return workspace ? { session, workspace } : null;
}

export function getWorkspaceSites(workspaceId: number) {
  return db.select().from(schema.agencySites)
    .where(and(
      eq(schema.agencySites.workspaceId, workspaceId),
      eq(schema.agencySites.active, true),
    ))
    .orderBy(schema.agencySites.name)
    .all();
}

function safeAgentStatus(json: string): Record<string, string> {
  try {
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return {};
  }
}

export function buildSiteReadout(site: typeof schema.agencySites.$inferSelect) {
  const brand = site.brandId
    ? db.select().from(schema.brands).where(eq(schema.brands.id, site.brandId)).get()
    : undefined;
  const scan = site.brandId ? getLatestLightweightScan(site.brandId) : undefined;
  if (!scan) {
    return { site, brand, scan: null, score: null, issues: [], fixes: [], stale: true };
  }
  const ageMs = Date.now() - new Date(scan.scannedAt).getTime();
  const stale = ageMs > FRESH_SCAN_HOURS * 60 * 60 * 1000;
  const status = safeAgentStatus(scan.agentStatusJson);
  const blocked = TRACKED_AGENT_IDS.filter((agent) =>
    status[agent] === "blocked" || status[agent] === "restricted",
  );
  const issues: string[] = [];
  if (blocked.length) issues.push(`${blocked.length} tracked AI agent${blocked.length === 1 ? "" : "s"} blocked or restricted`);
  if (!scan.hasSchemaProduct) issues.push("Schema.org Product markup missing");
  if (!scan.hasProductFeed) issues.push("No public product feed discovered");
  if (!scan.hasSitemap) issues.push("No usable sitemap discovered");
  if (!scan.hasLlmsTxt && !scan.hasAgentsTxt) issues.push("No AI-agent declaration file published");
  if (!scan.hasUcp) issues.push("No UCP endpoint detected");
  const domain = normalizeDomain(site.domain);
  return {
    site,
    brand,
    scan,
    score: computeArcScore(scan),
    issues,
    fixes: buildFixPrompts({
      domain,
      agentStatus: status,
      signals: {
        jsonLd: scan.hasJsonLd,
        schemaProduct: scan.hasSchemaProduct,
        openGraph: scan.hasOpenGraph,
        sitemap: scan.hasSitemap,
        productFeed: scan.hasProductFeed,
        llmsTxt: scan.hasLlmsTxt,
        agentsTxt: scan.hasAgentsTxt,
      },
      platform: scan.platform,
      waf: scan.waf,
    }),
    stale,
    history: site.brandId ? getBrandHistory(site.brandId, 30) : [],
  };
}

export function getWorkspaceReadout(workspaceId: number) {
  const workspace = db.select().from(schema.agencyWorkspaces)
    .where(eq(schema.agencyWorkspaces.id, workspaceId)).get();
  if (!workspace) return null;
  const sites = getWorkspaceSites(workspaceId).map(buildSiteReadout);
  const scored = sites.filter((item) => item.score);
  return {
    workspace,
    sites,
    averageScore: scored.length
      ? Math.round(scored.reduce((sum, item) => sum + (item.score?.total ?? 0), 0) / scored.length)
      : null,
    issueCount: sites.reduce((sum, item) => sum + item.issues.length, 0),
    staleCount: sites.filter((item) => item.stale).length,
  };
}

export function createPreview(workspaceId: number, siteIds?: number[]) {
  const sites = getWorkspaceSites(workspaceId);
  const selected = (siteIds?.length
    ? sites.filter((site) => siteIds.includes(site.id))
    : sites
        .map(buildSiteReadout)
        .filter((item) => item.scan && !item.stale && item.issues.length)
        .sort((a, b) => b.issues.length - a.issues.length)
        .slice(0, 2)
        .map((item) => item.site)
  ).slice(0, 5);
  if (selected.length < 2) throw new Error("A preview requires at least two fresh, evidence-backed portfolio sites.");

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_DAYS * 86400000).toISOString();
  const preview = db.insert(schema.agencyPreviews).values({
    workspaceId,
    tokenHash: hashToken(token),
    selectedSiteIdsJson: JSON.stringify(selected.map((site) => site.id)),
    expiresAt,
  }).returning().get();
  db.update(schema.agencyWorkspaces).set({
    status: "preview",
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.agencyWorkspaces.id, workspaceId)).run();
  return { preview, token };
}

export function getPreviewByToken(token: string, recordView = false) {
  const preview = db.select().from(schema.agencyPreviews)
    .where(and(
      eq(schema.agencyPreviews.tokenHash, hashToken(token)),
      sql`${schema.agencyPreviews.expiresAt} > ${new Date().toISOString()}`,
    )).get();
  if (!preview) return null;
  const workspace = db.select().from(schema.agencyWorkspaces)
    .where(eq(schema.agencyWorkspaces.id, preview.workspaceId)).get();
  if (!workspace) return null;
  let siteIds: number[] = [];
  try { siteIds = JSON.parse(preview.selectedSiteIdsJson) as number[]; } catch { siteIds = []; }
  const sites = siteIds.length
    ? db.select().from(schema.agencySites).where(inArray(schema.agencySites.id, siteIds)).all()
    : [];
  if (recordView) {
    const now = new Date().toISOString();
    db.update(schema.agencyPreviews).set({
      firstViewedAt: preview.firstViewedAt ?? now,
      lastViewedAt: now,
      viewCount: preview.viewCount + 1,
    }).where(eq(schema.agencyPreviews.id, preview.id)).run();
    recordAgencyEvent(workspace.id, "preview_viewed", {}, preview.id);
  }
  return { preview, workspace, sites: sites.map(buildSiteReadout) };
}

export function workspaceHasPaidAccess(workspace: typeof schema.agencyWorkspaces.$inferSelect): boolean {
  if (workspace.status === "active") return true;
  if (workspace.status === "trialing" && workspace.trialEndsAt) {
    return new Date(workspace.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

export function findWorkspaceByDomain(domain: string) {
  return db.select().from(schema.agencyWorkspaces)
    .where(eq(schema.agencyWorkspaces.domain, normalizeDomain(domain))).get();
}

export function pruneExpiredLoginTokens() {
  db.delete(schema.agencyLoginTokens).where(or(
    lt(schema.agencyLoginTokens.expiresAt, new Date().toISOString()),
    sql`${schema.agencyLoginTokens.usedAt} is not null`,
  )).run();
}

import { NextResponse } from "next/server";

// ── Types ──────────────────────────────────────────────────────────────

interface AgentAccessResult {
  agent: string;
  company: string;
  product: string;
  status: "allowed" | "blocked" | "no_rule";
}

interface IssueResult {
  severity: "critical" | "high" | "medium";
  title: string;
  locked: boolean;
}

interface StructuredDataResult {
  hasJsonLd: boolean;
  hasSchemaProduct: boolean;
  hasOpenGraph: boolean;
  hasProductFeed: boolean;
}

interface InstantCheckResponse {
  url: string;
  checkedAt: string;
  score: number;
  grade: string;
  agentAccess: AgentAccessResult[];
  issues: IssueResult[];
  structuredData: StructuredDataResult;
  blockedAgentCount: number;
  totalAgentsChecked: number;
  semanticHtml: {
    hasNav: boolean;
    hasMain: boolean;
    hasH1: boolean;
  };
}

// ── Agent definitions for robots.txt checking ──────────────────────────

const AGENTS_TO_CHECK = [
  { userAgent: "GPTBot", company: "OpenAI", product: "ChatGPT Shopping" },
  { userAgent: "ChatGPT-User", company: "OpenAI", product: "ChatGPT Operator" },
  { userAgent: "PerplexityBot", company: "Perplexity", product: "Perplexity Shopping" },
  { userAgent: "ClaudeBot", company: "Anthropic", product: "Claude Computer Use" },
  { userAgent: "Google-Extended", company: "Google", product: "Google AI Mode" },
  { userAgent: "Amazonbot", company: "Amazon", product: "Amazon Buy For Me" },
  { userAgent: "Bingbot", company: "Microsoft", product: "Microsoft Copilot" },
  { userAgent: "CCBot", company: "Common Crawl", product: "Klarna AI / OpenClaw" },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function getBaseUrl(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ARCScoreBot/1.0; +https://arcscore.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── robots.txt Parser ──────────────────────────────────────────────────

interface RobotsRule {
  userAgent: string;
  disallowAll: boolean;
  allowAll: boolean;
}

function parseRobotsTxt(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  const lines = text.split("\n").map((l) => l.trim());

  let currentAgents: string[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith("#") || line === "") {
      if (currentAgents.length > 0 && line === "") {
        currentAgents = [];
      }
      continue;
    }

    const [directive, ...valueParts] = line.split(":");
    const key = directive.trim().toLowerCase();
    const value = valueParts.join(":").trim();

    if (key === "user-agent") {
      currentAgents.push(value);
    } else if (key === "disallow" && currentAgents.length > 0) {
      if (value === "/" || value === "/*") {
        for (const agent of currentAgents) {
          rules.push({ userAgent: agent, disallowAll: true, allowAll: false });
        }
      }
    } else if (key === "allow" && currentAgents.length > 0) {
      if (value === "/" || value === "/*" || value === "") {
        for (const agent of currentAgents) {
          rules.push({ userAgent: agent, disallowAll: false, allowAll: true });
        }
      }
    }
  }

  return rules;
}

function checkAgentAccess(
  robotsRules: RobotsRule[],
  agentName: string
): "allowed" | "blocked" | "no_rule" {
  // Check for specific agent rules first
  const specificRules = robotsRules.filter(
    (r) => r.userAgent.toLowerCase() === agentName.toLowerCase()
  );

  if (specificRules.length > 0) {
    // If any specific rule blocks, it's blocked
    if (specificRules.some((r) => r.disallowAll)) return "blocked";
    if (specificRules.some((r) => r.allowAll)) return "allowed";
  }

  // Check wildcard rules
  const wildcardRules = robotsRules.filter((r) => r.userAgent === "*");
  if (wildcardRules.length > 0) {
    if (wildcardRules.some((r) => r.disallowAll)) return "blocked";
    if (wildcardRules.some((r) => r.allowAll)) return "allowed";
  }

  return "no_rule";
}

// ── Checkers ───────────────────────────────────────────────────────────

async function checkRobotsTxt(
  baseUrl: string
): Promise<AgentAccessResult[]> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/robots.txt`);
    if (!res.ok) {
      // No robots.txt = all agents allowed (no_rule)
      return AGENTS_TO_CHECK.map((a) => ({
        agent: a.userAgent,
        company: a.company,
        product: a.product,
        status: "no_rule" as const,
      }));
    }

    const text = await res.text();
    const rules = parseRobotsTxt(text);

    return AGENTS_TO_CHECK.map((a) => ({
      agent: a.userAgent,
      company: a.company,
      product: a.product,
      status: checkAgentAccess(rules, a.userAgent),
    }));
  } catch {
    // On error, return no_rule for all
    return AGENTS_TO_CHECK.map((a) => ({
      agent: a.userAgent,
      company: a.company,
      product: a.product,
      status: "no_rule" as const,
    }));
  }
}

async function checkStructuredDataAndHtml(pageUrl: string): Promise<{
  structuredData: StructuredDataResult;
  semanticHtml: { hasNav: boolean; hasMain: boolean; hasH1: boolean };
  productPageUrl: string | null;
}> {
  try {
    const res = await fetchWithTimeout(pageUrl);
    if (!res.ok) {
      return {
        structuredData: {
          hasJsonLd: false,
          hasSchemaProduct: false,
          hasOpenGraph: false,
          hasProductFeed: false,
        },
        semanticHtml: { hasNav: false, hasMain: false, hasH1: false },
        productPageUrl: null,
      };
    }

    const html = await res.text();
    const htmlLower = html.toLowerCase();

    // JSON-LD check
    const hasJsonLd =
      html.includes("application/ld+json") ||
      html.includes("application/ld\\u002Bjson");

    // Schema.org Product check
    const hasSchemaProduct =
      (hasJsonLd &&
        (html.includes('"@type":"Product"') ||
          html.includes('"@type": "Product"') ||
          html.includes('"@type":"product"') ||
          html.includes('"@type": "product"'))) ||
      html.includes('itemtype="http://schema.org/Product"') ||
      html.includes('itemtype="https://schema.org/Product"') ||
      html.includes("vocab=\"http://schema.org/\"") ||
      html.includes("vocab=\"https://schema.org/\"");

    // Open Graph check
    const hasOpenGraph =
      htmlLower.includes('property="og:') ||
      htmlLower.includes("property='og:") ||
      htmlLower.includes('property="og:title"') ||
      htmlLower.includes('name="og:');

    // Semantic HTML
    const hasNav = htmlLower.includes("<nav");
    const hasMain = htmlLower.includes("<main");
    const hasH1 = htmlLower.includes("<h1");

    // Try to find a product page link
    let productPageUrl: string | null = null;
    const productLinkPatterns = [
      /href=["'](\/products\/[^"'#?]+)/i,
      /href=["'](\/product\/[^"'#?]+)/i,
      /href=["'](\/p\/[^"'#?]+)/i,
      /href=["'](\/shop\/[^"'#?]+)/i,
      /href=["'](\/collections\/[^"']+\/products\/[^"'#?]+)/i,
      /href=["'](https?:\/\/[^"']*\/products\/[^"'#?]+)/i,
      /href=["'](https?:\/\/[^"']*\/product\/[^"'#?]+)/i,
    ];

    for (const pattern of productLinkPatterns) {
      const match = html.match(pattern);
      if (match) {
        const href = match[1];
        if (href.startsWith("http")) {
          productPageUrl = href;
        } else {
          const base = getBaseUrl(pageUrl);
          productPageUrl = `${base}${href}`;
        }
        break;
      }
    }

    return {
      structuredData: {
        hasJsonLd,
        hasSchemaProduct,
        hasOpenGraph,
        hasProductFeed: false, // checked separately
      },
      semanticHtml: { hasNav, hasMain, hasH1 },
      productPageUrl,
    };
  } catch {
    return {
      structuredData: {
        hasJsonLd: false,
        hasSchemaProduct: false,
        hasOpenGraph: false,
        hasProductFeed: false,
      },
      semanticHtml: { hasNav: false, hasMain: false, hasH1: false },
      productPageUrl: null,
    };
  }
}

async function checkProductPage(url: string): Promise<{
  hasSchemaProduct: boolean;
  hasJsonLd: boolean;
}> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { hasSchemaProduct: false, hasJsonLd: false };

    const html = await res.text();

    const hasJsonLd =
      html.includes("application/ld+json") ||
      html.includes("application/ld\\u002Bjson");

    const hasSchemaProduct =
      (hasJsonLd &&
        (html.includes('"@type":"Product"') ||
          html.includes('"@type": "Product"') ||
          html.includes('"@type":"product"') ||
          html.includes('"@type": "product"'))) ||
      html.includes('itemtype="http://schema.org/Product"') ||
      html.includes('itemtype="https://schema.org/Product"');

    return { hasSchemaProduct, hasJsonLd };
  } catch {
    return { hasSchemaProduct: false, hasJsonLd: false };
  }
}

async function checkProductFeed(baseUrl: string): Promise<boolean> {
  const feedPaths = [
    "/products.json",
    "/feed/products.xml",
    "/sitemap_products.xml",
    "/collections/all.atom",
    "/feed",
    "/product-feed.xml",
  ];

  const checks = feedPaths.map(async (path) => {
    try {
      const res = await fetchWithTimeout(`${baseUrl}${path}`, 8000);
      if (!res.ok) return false;
      const contentType = res.headers.get("content-type") || "";
      // If we get JSON or XML back, it's likely a feed
      if (
        contentType.includes("json") ||
        contentType.includes("xml") ||
        contentType.includes("atom")
      ) {
        return true;
      }
      // Check body for product-like content
      const text = await res.text();
      if (
        text.includes('"products"') ||
        text.includes("<product") ||
        text.includes("<entry") ||
        text.includes('"title"')
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const results = await Promise.all(checks);
  return results.some(Boolean);
}

// ── Scoring ────────────────────────────────────────────────────────────

function computeScore(
  agentAccess: AgentAccessResult[],
  structuredData: StructuredDataResult,
  semanticHtml: { hasNav: boolean; hasMain: boolean; hasH1: boolean }
): { score: number; grade: string } {
  let score = 0;

  // Agent access (max 35 points)
  // 8 agents, each worth up to ~4.4 points
  const agentPoints = agentAccess.reduce((sum, a) => {
    if (a.status === "allowed") return sum + 4.375;
    if (a.status === "no_rule") return sum + 3; // no_rule is okay-ish (means default allowed, but not explicitly)
    return sum; // blocked = 0
  }, 0);
  score += agentPoints;

  // Structured data (max 35 points)
  if (structuredData.hasJsonLd) score += 10;
  if (structuredData.hasSchemaProduct) score += 10;
  if (structuredData.hasOpenGraph) score += 8;
  if (structuredData.hasProductFeed) score += 7;

  // Semantic HTML (max 15 points)
  if (semanticHtml.hasNav) score += 5;
  if (semanticHtml.hasMain) score += 5;
  if (semanticHtml.hasH1) score += 5;

  // Baseline for having a working website (max 15 points)
  // If we got this far, the site is at least reachable
  score += 15;

  score = Math.min(100, Math.round(score));

  // Grade
  let grade: string;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 65) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  return { score, grade };
}

// ── Issue Generation ───────────────────────────────────────────────────

function generateIssues(
  agentAccess: AgentAccessResult[],
  structuredData: StructuredDataResult,
  semanticHtml: { hasNav: boolean; hasMain: boolean; hasH1: boolean }
): IssueResult[] {
  const issues: IssueResult[] = [];

  // Agent blocking issues
  const blockedAgents = agentAccess.filter((a) => a.status === "blocked");
  if (blockedAgents.length >= 4) {
    issues.push({
      severity: "critical",
      title: `${blockedAgents.length} of 8 AI agents are blocked in robots.txt`,
      locked: true,
    });
  } else if (blockedAgents.length > 0) {
    const names = blockedAgents.map((a) => a.agent).join(", ");
    issues.push({
      severity: "high",
      title: `${names} blocked in robots.txt`,
      locked: true,
    });
  }

  // Specific high-value agent blocks
  const gptBotBlocked = agentAccess.find(
    (a) => a.agent === "GPTBot" && a.status === "blocked"
  );
  if (gptBotBlocked && blockedAgents.length < 4) {
    issues.push({
      severity: "critical",
      title: "GPTBot is blocked — invisible to ChatGPT Shopping",
      locked: true,
    });
  }

  const googleBlocked = agentAccess.find(
    (a) => a.agent === "Google-Extended" && a.status === "blocked"
  );
  if (googleBlocked && blockedAgents.length < 4) {
    issues.push({
      severity: "high",
      title: "Google-Extended is blocked — excluded from Google AI Mode",
      locked: true,
    });
  }

  // Structured data issues
  if (!structuredData.hasJsonLd) {
    issues.push({
      severity: "critical",
      title: "No JSON-LD structured data found on homepage",
      locked: true,
    });
  }

  if (!structuredData.hasSchemaProduct) {
    issues.push({
      severity: "high",
      title: "No Schema.org Product markup detected",
      locked: true,
    });
  }

  if (!structuredData.hasOpenGraph) {
    issues.push({
      severity: "medium",
      title: "Missing Open Graph tags — AI agents can't preview products",
      locked: true,
    });
  }

  if (!structuredData.hasProductFeed) {
    issues.push({
      severity: "medium",
      title: "No product feed detected (JSON, XML, or Atom)",
      locked: true,
    });
  }

  // Semantic HTML issues
  if (!semanticHtml.hasNav) {
    issues.push({
      severity: "medium",
      title: "No <nav> element — browser agents can't identify navigation",
      locked: true,
    });
  }

  if (!semanticHtml.hasMain) {
    issues.push({
      severity: "medium",
      title: "No <main> element — agents can't distinguish content from chrome",
      locked: true,
    });
  }

  if (!semanticHtml.hasH1) {
    issues.push({
      severity: "medium",
      title: "No <h1> element found — poor content hierarchy for agents",
      locked: true,
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}

// ── Main Handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url: rawUrl } = body;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const url = normalizeUrl(rawUrl);

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(url);

    // Run initial checks in parallel
    const [agentAccess, homepageData, hasFeed] = await Promise.all([
      checkRobotsTxt(baseUrl),
      checkStructuredDataAndHtml(url),
      checkProductFeed(baseUrl),
    ]);

    // If we found a product page, check it too
    let productPageData = { hasSchemaProduct: false, hasJsonLd: false };
    if (homepageData.productPageUrl) {
      productPageData = await checkProductPage(homepageData.productPageUrl);
    }

    // Merge structured data — mark product schema as found if either page has it
    const structuredData: StructuredDataResult = {
      hasJsonLd:
        homepageData.structuredData.hasJsonLd || productPageData.hasJsonLd,
      hasSchemaProduct:
        homepageData.structuredData.hasSchemaProduct ||
        productPageData.hasSchemaProduct,
      hasOpenGraph: homepageData.structuredData.hasOpenGraph,
      hasProductFeed: hasFeed,
    };

    const blockedAgentCount = agentAccess.filter(
      (a) => a.status === "blocked"
    ).length;

    const issues = generateIssues(
      agentAccess,
      structuredData,
      homepageData.semanticHtml
    );

    const { score, grade } = computeScore(
      agentAccess,
      structuredData,
      homepageData.semanticHtml
    );

    const response: InstantCheckResponse = {
      url,
      checkedAt: new Date().toISOString(),
      score,
      grade,
      agentAccess,
      issues,
      structuredData,
      blockedAgentCount,
      totalAgentsChecked: AGENTS_TO_CHECK.length,
      semanticHtml: homepageData.semanticHtml,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Instant check error:", error);
    return NextResponse.json(
      { error: "Failed to check URL. The site may be unreachable or blocking requests." },
      { status: 500 }
    );
  }
}

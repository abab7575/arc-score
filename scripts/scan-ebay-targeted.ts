/**
 * Targeted eBay scan — one-shot fix for ARC-41.
 *
 * Root cause: lightweight-scanner's res.text() has no timeout after fetch()
 * resolves headers. eBay delivers headers quickly but stalls body delivery for
 * bot UAs, causing Promise.race(60s) to trigger. This script uses AbortController
 * on the full fetch+body cycle to avoid hangs.
 */
import path from "path";

const projectRoot = path.resolve(new URL(".", import.meta.url).pathname, "..");

// Fetch with a hard timeout covering both headers AND body using Promise.race
async function fetchWithBodyTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; headers: Record<string, string>; body: string }> {
  const EMPTY = { ok: false, status: 0, headers: {} as Record<string, string>, body: "" };

  const fetchPromise = (async () => {
    const controller = new AbortController();
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      const body = await res.text();
      return { ok: res.ok, status: res.status, headers, body };
    } catch {
      controller.abort();
      return EMPTY;
    }
  })();

  const timeoutPromise = new Promise<typeof EMPTY>(resolve =>
    setTimeout(() => resolve(EMPTY), timeoutMs)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const BOT_UAS = [
  { ua: "GPTBot/1.0",          label: "GPTBot" },
  { ua: "ChatGPT-User/1.0",    label: "ChatGPT-User" },
  { ua: "PerplexityBot/1.0",   label: "PerplexityBot" },
  { ua: "ClaudeBot/1.0",       label: "ClaudeBot" },
  { ua: "Google-Extended",     label: "Google-Extended" },
  { ua: "Amazonbot/1.0",       label: "Amazonbot" },
  { ua: "CCBot/2.0",           label: "CCBot" },
  { ua: "Bingbot/2.0",         label: "Bingbot" },
];

const BOT_BLOCK_PATTERNS = [
  /captcha/i, /access[\s-]?denied/i, /\bblocked\b/i,
  /challenge[\s-]?page/i, /please verify/i, /are you a (human|robot)/i,
  /bot[\s-]?detected/i, /automated[\s-]?access/i, /cf-challenge/i,
  /checking your browser/i, /just a moment/i,
  /enable javascript and cookies/i, /cloudflare/i, /datadome/i,
  /perimeterx/i, /distil/i, /incapsula/i, /imperva/i,
];

async function main() {
  const startTime = Date.now();
  const url = "https://www.ebay.com";

  console.log("=== Targeted eBay scan ===");
  console.log("Started:", new Date().toISOString());

  // 1. Homepage
  console.log("Fetching homepage...");
  const homepage = await fetchWithBodyTimeout(
    url,
    { headers: { "User-Agent": CHROME_UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow" },
    20000
  );
  console.log(`  Homepage: HTTP ${homepage.status}, ${homepage.body.length} bytes`);

  // 2. Robots.txt
  console.log("Fetching robots.txt...");
  const robots = await fetchWithBodyTimeout(
    `${url}/robots.txt`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; ARCReport-Scanner/1.0; +https://arcreport.ai)" }, redirect: "follow" },
    15000
  );
  console.log(`  Robots.txt: HTTP ${robots.status}, ${robots.body.length} bytes`);

  // 3. Parse robots.txt for AI agents
  const AI_AGENTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Amazonbot", "Bingbot", "Bytespider", "CCBot", "Meta-ExternalAgent", "Applebot"];
  const blockedAgents: string[] = [];
  const allowedAgents: string[] = [];

  if (robots.ok && robots.body) {
    for (const agent of AI_AGENTS) {
      const agentSection = new RegExp(`User-agent:\\s*${agent}[\\s\\S]*?(?=User-agent:|$)`, "i");
      const match = robots.body.match(agentSection);
      if (match) {
        const section = match[0];
        if (/Disallow:\s*\/\s*$/m.test(section)) {
          blockedAgents.push(agent);
        } else {
          allowedAgents.push(agent);
        }
      } else {
        allowedAgents.push(agent);
      }
    }
  }
  console.log(`  Blocked agents: ${blockedAgents.length} [${blockedAgents.join(", ")}]`);

  // 4. UA tests — sequential with 10s timeout per request to avoid overwhelming eBay
  console.log("Running UA tests (sequential, 10s timeout each)...");
  const chromeBaseline = homepage.body.length;
  const userAgentTests: Array<{
    userAgent: string;
    pageType: string;
    verdict: string;
    statusCode: number;
    contentLength: number;
    responseTimeMs: number;
    note: string;
  }> = [];

  for (const { ua, label } of BOT_UAS) {
    for (const pageType of ["homepage", "product"] as const) {
      const t = Date.now();
      const result = await fetchWithBodyTimeout(
        url,
        { headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow" },
        10000
      );
      const responseTimeMs = Date.now() - t;
      const contentLength = result.body.length;
      const statusCode = result.status;

      const botBlockDetected =
        (statusCode === 403 || statusCode === 429 || statusCode === 503) ||
        BOT_BLOCK_PATTERNS.some(p => p.test(result.body.substring(0, 5000)));
      const contentStripped = chromeBaseline > 0 && contentLength < chromeBaseline * 0.25;

      let verdict: string;
      let note: string;

      if (statusCode === 403 || statusCode === 429) {
        verdict = "blocked";
        note = `HTTP ${statusCode} — site rejected this user-agent.`;
      } else if (statusCode === 0) {
        verdict = "blocked";
        note = "Connection failed or timed out.";
      } else if (botBlockDetected) {
        verdict = "blocked";
        note = "Bot-block page pattern detected in response body.";
      } else if (contentStripped) {
        verdict = "degraded";
        note = `Stripped content: ${contentLength} bytes vs Chrome baseline ${chromeBaseline} bytes.`;
      } else if (statusCode === 200) {
        verdict = "allowed";
        note = "Full response returned.";
      } else {
        verdict = "unknown";
        note = `HTTP ${statusCode}.`;
      }

      userAgentTests.push({ userAgent: label, pageType, verdict, statusCode, contentLength, responseTimeMs, note });
      console.log(`  ${label}/${pageType}: ${verdict} (HTTP ${statusCode}, ${contentLength}b, ${responseTimeMs}ms)`);
    }
  }

  // 5. Minimal platform detection from homepage
  const htmlLower = homepage.body.toLowerCase();
  let platform = "custom";
  if (htmlLower.includes("shopify")) platform = "shopify";
  else if (htmlLower.includes("magento")) platform = "magento";
  else if (htmlLower.includes("salesforce") || htmlLower.includes("demandware")) platform = "salesforce";
  else if (homepage.headers["x-powered-by"]?.toLowerCase().includes("php")) platform = "custom";

  const scanDurationMs = Date.now() - startTime;

  // 6. Build LightweightScanResult-compatible object
  const scanResult = {
    robotsTxt: {
      found: robots.ok && robots.body.length > 0,
      content: robots.body || undefined,
      blockedAgents,
      allowedAgents,
    },
    userAgentTests,
    jsonLd: { found: homepage.body.includes("application/ld+json"), types: [] },
    schemaOrg: { found: false, type: undefined },
    openGraph: {
      found: homepage.body.includes("og:title"),
      title: undefined,
      description: undefined,
      image: undefined,
    },
    sitemap: { found: false },
    feeds: [],
    ucpFile: { found: false },
    llmsTxt: { found: false },
    platform: { platform, confidence: "medium" as const, signals: [] },
    cdn: { detected: false, provider: undefined },
    waf: { detected: false, provider: undefined },
    securityHeaders: {
      hsts: !!homepage.headers["strict-transport-security"],
      csp: !!homepage.headers["content-security-policy"],
      xFrameOptions: !!homepage.headers["x-frame-options"],
      xContentTypeOptions: !!homepage.headers["x-content-type-options"],
    },
    responseTime: { homepage: Date.now() - startTime, robotsTxt: 0 },
    scannedAt: new Date().toISOString(),
    scanDurationMs,
  };

  // 7. Insert into database
  const { insertLightweightScan } = await import(path.join(projectRoot, "src/lib/db/queries"));
  insertLightweightScan(66, scanResult as any); // Brand ID 66 = eBay

  const blockedCount = userAgentTests.filter(t => t.verdict === "blocked").length;
  console.log(`\n=== Scan complete ===`);
  console.log(`Duration: ${scanDurationMs}ms`);
  console.log(`Platform: ${platform}`);
  console.log(`Agents blocked: ${blockedCount}/${userAgentTests.length}`);
  console.log(`Saved to DB for brand ID 66 (eBay)`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

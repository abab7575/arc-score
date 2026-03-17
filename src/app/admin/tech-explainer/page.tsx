"use client";

import { useState } from "react";

type Level = "basic" | "intermediate" | "advanced" | "critical";

export default function TechExplainerPage() {
  const [activeLevel, setActiveLevel] = useState<Level>("basic");

  const levels: { id: Level; label: string; emoji: string; color: string }[] = [
    { id: "basic", label: "ELI10", emoji: "🧒", color: "#FBBA16" },
    { id: "intermediate", label: "College", emoji: "🎓", color: "#0259DD" },
    { id: "advanced", label: "Advanced", emoji: "🔬", color: "#7C3AED" },
    { id: "critical", label: "Critical Audit", emoji: "🔥", color: "#FF6648" },
  ];

  return (
    <div style={{ backgroundColor: "#0A1628", minHeight: "100vh", color: "#FFF8F0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: 2, color: "#FF6648", textTransform: "uppercase", marginBottom: 8 }}>
            INTERNAL — FOR ANDY ONLY
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            How ARC Report <span style={{ color: "#FBBA16" }}>Actually</span> Works
          </h1>
          <p style={{ color: "#94A3B8", marginTop: 8, fontSize: 15 }}>
            The real tech behind the product. No marketing. No sugarcoating.
          </p>
        </div>

        {/* Level Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLevel(l.id)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: activeLevel === l.id ? `2px solid ${l.color}` : "2px solid #1E293B",
                backgroundColor: activeLevel === l.id ? `${l.color}20` : "#0F1D32",
                color: activeLevel === l.id ? l.color : "#94A3B8",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {l.emoji} {l.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeLevel === "basic" && <BasicLevel />}
        {activeLevel === "intermediate" && <IntermediateLevel />}
        {activeLevel === "advanced" && <AdvancedLevel />}
        {activeLevel === "critical" && <CriticalLevel />}
      </div>
    </div>
  );
}

/* ================================================================
   CARD COMPONENTS
   ================================================================ */

function Card({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "#0F1D32",
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      borderLeft: `4px solid ${color}`,
    }}>
      <h3 style={{ color, fontSize: 16, fontFamily: "JetBrains Mono, monospace", marginTop: 0, marginBottom: 12 }}>
        {title}
      </h3>
      <div style={{ color: "#CBD5E1", lineHeight: 1.7, fontSize: 15 }}>
        {children}
      </div>
    </div>
  );
}

function HonestBadge({ type }: { type: "real" | "modeled" | "gap" | "partial" }) {
  const config = {
    real: { bg: "#059669", text: "GENUINELY REAL" },
    modeled: { bg: "#D97706", text: "MODELED / PROJECTED" },
    gap: { bg: "#DC2626", text: "GAP — NEEDS FIXING" },
    partial: { bg: "#0259DD", text: "REAL + MODELED HYBRID" },
  };
  const c = config[type];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      backgroundColor: `${c.bg}30`,
      color: c.bg,
      fontSize: 11,
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 700,
      letterSpacing: 1,
      marginLeft: 8,
      verticalAlign: "middle",
    }}>
      {c.text}
    </span>
  );
}

function DiagramBox({ label, description, color }: { label: string; description: string; color: string }) {
  return (
    <div style={{
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: 8,
      padding: "12px 16px",
      marginBottom: 8,
    }}>
      <strong style={{ color, fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>{label}</strong>
      <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94A3B8" }}>{description}</p>
    </div>
  );
}

/* ================================================================
   BASIC LEVEL — ELI10
   ================================================================ */

function BasicLevel() {
  return (
    <div>
      <Card title="WHAT WE DO — SIMPLE VERSION" color="#FBBA16">
        <p><strong>Imagine you own a shop on a street.</strong> Normally, humans walk in, look around, pick stuff up, and buy things. Your shop is designed for human eyes and human hands.</p>
        <p>Now imagine <strong>robots start shopping too</strong>. Not physical robots — software robots. Like ChatGPT helping someone find a birthday present, or Google&apos;s AI comparing prices for you.</p>
        <p>These robot shoppers need to:</p>
        <ul>
          <li>🔍 <strong>Find</strong> your shop (can they see your products in their search results?)</li>
          <li>📋 <strong>Read</strong> your product info (price, size, color, availability)</li>
          <li>🛒 <strong>Add to cart</strong> and <strong>check out</strong> (can they actually buy?)</li>
        </ul>
        <p>Most shops weren&apos;t built for robots. <strong>We test whether robots can shop at your store</strong>, and tell you what&apos;s broken.</p>
      </Card>

      <Card title="HOW WE TEST — SIMPLE VERSION" color="#0259DD">
        <p>We send <strong>5 different testers</strong> to your website:</p>
        <ol>
          <li>🌐 <strong>The Browser</strong> — Opens your site in a real web browser, clicks buttons, tries to add things to cart, tries to check out. Like a robot customer actually shopping.</li>
          <li>📊 <strong>The Data Reader</strong> — Reads the invisible code behind your website. Checks if you&apos;ve labeled your products properly so robots can understand them.</li>
          <li>♿ <strong>The Accessibility Checker</strong> — Tests whether a robot can find buttons, read labels, and navigate without seeing the page visually.</li>
          <li>👁️ <strong>The Visual Inspector</strong> — Takes screenshots and asks an AI &ldquo;can you find the buy button?&rdquo; If the AI can&apos;t find it, neither can a robot shopper.</li>
          <li>📡 <strong>The Feed Checker</strong> — Looks for product data feeds (like a menu that robots can read) that AI shopping platforms need.</li>
        </ol>
      </Card>

      <Card title="THE SCORE" color="#7C3AED">
        <p>After all 5 testers finish, we calculate a score from <strong>0 to 100</strong>.</p>
        <ul>
          <li><strong style={{ color: "#059669" }}>85-100 (Grade A)</strong> — Robots can shop here easily</li>
          <li><strong style={{ color: "#0259DD" }}>70-84 (Grade B)</strong> — Mostly works, some issues</li>
          <li><strong style={{ color: "#FBBA16" }}>50-69 (Grade C)</strong> — Significant problems</li>
          <li><strong style={{ color: "#F97316" }}>30-49 (Grade D)</strong> — Major failures</li>
          <li><strong style={{ color: "#DC2626" }}>0-29 (Grade F)</strong> — Robots basically can&apos;t use this site</li>
        </ul>
        <p>We also show which <strong>specific robots</strong> (ChatGPT, Google AI, Perplexity, etc.) would have the most trouble, and give a <strong>fix list</strong> sorted by what would have the biggest impact.</p>
      </Card>

      <Card title="THE 10 AGENTS — HONEST EXPLANATION" color="#FF6648">
        <p>We say we test compatibility with <strong>10 AI shopping agents</strong>. Here&apos;s what that actually means:</p>
        <p>We send our 5 testers, which check your site in a general way. Then we <strong>calculate</strong> how each of the 10 real AI agents would likely perform, based on what they care about.</p>
        <p>Think of it like a driving test. You take <strong>one test</strong>, but the examiner can tell you: &ldquo;You&apos;d do great in a sedan, okay in a truck, and struggle with a motorbike.&rdquo; Same test, different vehicles, different results based on what each vehicle needs.</p>
        <p>But we also <strong>knock on your website&apos;s door wearing each agent&apos;s name tag</strong>. We go: &ldquo;Hi, I&apos;m ChatGPT,&rdquo; &ldquo;Hi, I&apos;m Perplexity,&rdquo; &ldquo;Hi, I&apos;m Claude&rdquo; — and check if your site lets them in or blocks them. Some shops block certain robots but allow others. So the driving test analogy still holds, but now we also check if the door is locked for each specific vehicle before it can even start the test.</p>
        <p>This means each agent&apos;s score is a combination of the projected driving-test results <strong>and</strong> whether they were actually allowed through the door in the first place.</p>
      </Card>
    </div>
  );
}

/* ================================================================
   INTERMEDIATE LEVEL — COLLEGE
   ================================================================ */

function IntermediateLevel() {
  return (
    <div>
      <Card title="THE SCANNING PIPELINE" color="#0259DD">
        <p>When we scan a brand, 5 agents run in sequence:</p>
        <DiagramBox label="1. BROWSER AGENT" description="Puppeteer (headless Chrome) with stealth plugin. Navigates homepage → product page → add to cart → checkout. Takes annotated screenshots at each step. Actually clicks real buttons." color="#0259DD" />
        <DiagramBox label="2. DATA AGENT" description="HTTP requests (no browser). Parses HTML for JSON-LD/Schema.org structured data, checks robots.txt for AI bot rules, probes for sitemaps, API endpoints, ACP protocol, llms.txt." color="#059669" />
        <DiagramBox label="3. ACCESSIBILITY AGENT" description="Uses Puppeteer's accessibility tree API. Checks landmarks, headings, labeled elements, focusable elements. Tests whether agent selectors can find key interactive elements." color="#7C3AED" />
        <DiagramBox label="4. VISUAL AGENT (weekly)" description="Screenshots sent to Claude Sonnet vision API. Asks: 'Can you see the price? Where would you click to buy? Is the mobile layout clear?' Directly models the multimodal agent experience." color="#FBBA16" />
        <DiagramBox label="5. FEED AGENT (weekly)" description="Probes 9+ common feed URLs (Google Merchant XML, Shopify products.json, RSS/Atom). Parses feed quality — missing fields, product count, data completeness." color="#FF6648" />
      </Card>

      <Card title="7 SCORING CATEGORIES" color="#7C3AED">
        <p>Raw findings from all 5 agents map into 7 weighted categories:</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E293B" }}>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#FBBA16" }}>Category</th>
              <th style={{ textAlign: "right", padding: "8px 0", color: "#FBBA16" }}>Weight</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#FBBA16" }}>What It Measures</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Cart & Checkout", "25%", "Add-to-cart success, checkout reached, guest checkout, API endpoints"],
              ["Product Understanding", "20%", "Schema.org Product markup, price/offers/SKU/GTIN in structured data"],
              ["Navigation & Interaction", "20%", "Cookie consent handling, variant selection, labeled elements, overlays"],
              ["Discoverability", "15%", "Homepage load, navigation structure, product page accessibility"],
              ["Agentic Commerce", "10%", "ACP protocol, cart/checkout APIs, GraphQL, UCP, llms.txt"],
              ["Performance & Resilience", "5%", "Bot blocking, CAPTCHA presence, page load time"],
              ["Data Standards & Feeds", "5%", "robots.txt rules, sitemap, OG tags, merchant feeds"],
            ].map(([cat, weight, desc]) => (
              <tr key={cat} style={{ borderBottom: "1px solid #1E293B10" }}>
                <td style={{ padding: "8px 0", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>{cat}</td>
                <td style={{ padding: "8px 0", textAlign: "right", color: "#FBBA16" }}>{weight}</td>
                <td style={{ padding: "8px 12px", color: "#94A3B8", fontSize: 13 }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="5 SCANNERS → 10 AGENT PROFILES" color="#FF6648">
        <p>The 10 AI agent &ldquo;compatibility scores&rdquo; are now a <strong>combination of two things</strong>:</p>
        <ol>
          <li><strong>Weighted projections</strong> — Each agent profile has a weight vector across the 7 categories. The agent&apos;s base score = dot product of category scores × agent weights.</li>
          <li><strong>Real per-agent access testing</strong> — We test with 8 actual user-agent strings (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Amazonbot, CCBot, Bingbot) and check whether the site blocks, restricts, or serves different content to each one.</li>
        </ol>
        <p>This means the scores are <strong>no longer purely modeled</strong>. They incorporate real differential data — if a site blocks GPTBot but allows PerplexityBot, those agents will get genuinely different scores, not just different weights on the same numbers.</p>
        <p><strong>Feed-based agents</strong> (ChatGPT Shopping, Google AI Mode, Perplexity Shopping, Copilot, Klarna) weight Data Standards and Product Understanding heavily. They don&apos;t care about Navigation.</p>
        <p><strong>Browser-based agents</strong> (Operator, Buy For Me, Comet, Computer Use, OpenClaw) weight Cart &amp; Checkout and Navigation heavily. They don&apos;t care about Agentic Commerce protocols.</p>
        <p>This is <strong>conceptually sound and now empirically grounded</strong>. The weighted model captures capability differences between agents, while the user-agent testing captures real access differences. Browser agents that share the same user-agent will still score similarly on access, but their weighted profiles can still differ.</p>
      </Card>

      <Card title="WHAT THE BROWSER AGENT ACTUALLY DOES" color="#0259DD">
        <p>Real Puppeteer steps with <code>page.mouse.click()</code>:</p>
        <ol style={{ lineHeight: 2 }}>
          <li><strong>Load homepage</strong> — checks for bot-blocking pages</li>
          <li><strong>Handle cookie consent</strong> — detects accept/agree buttons by class/text, clicks them</li>
          <li><strong>Explore nav</strong> — enumerates all links in header/nav elements</li>
          <li><strong>Navigate to product</strong> — uses provided URL or hunts for product links</li>
          <li><strong>Analyze product page</strong> — extracts title, price, images, add-to-cart button via CSS selectors</li>
          <li><strong>Select variant</strong> — attempts to click size/color selectors</li>
          <li><strong>Add to cart</strong> — clicks the button. Checks click succeeded but does NOT verify cart updated.</li>
          <li><strong>Attempt checkout</strong> — navigates to checkout, checks for guest checkout option. Does NOT fill in payment.</li>
        </ol>
      </Card>
    </div>
  );
}

/* ================================================================
   ADVANCED LEVEL
   ================================================================ */

function AdvancedLevel() {
  return (
    <div>
      <Card title="WHAT MAKES THIS TECHNICALLY DEFENSIBLE" color="#059669">
        <p>If a technical person scrutinizes ARC Report, here&apos;s what holds up:</p>

        <h4 style={{ color: "#059669", marginTop: 16 }}>Data Agent — Rock Solid <HonestBadge type="real" /></h4>
        <ul>
          <li>Parses real JSON-LD/Schema.org from the DOM, including JS-rendered markup (uses browser agent&apos;s rendered HTML)</li>
          <li>Checks robots.txt for 8 specific AI user agents: GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, CCBot, Amazonbot</li>
          <li>Probes real API endpoints (/products.json, GraphQL, /cart.js, etc.)</li>
          <li>Checks cutting-edge protocols: ACP (Agentic Commerce Protocol), UCP, llms.txt</li>
          <li>All findings are observable, verifiable facts — not opinions</li>
        </ul>

        <h4 style={{ color: "#059669", marginTop: 16 }}>Visual Agent — Creative Differentiator <HonestBadge type="real" /></h4>
        <ul>
          <li>Sends real screenshots to Claude Sonnet&apos;s vision API</li>
          <li>Asks &ldquo;where would you click to add to cart?&rdquo; — directly models what Claude Computer Use / GPT-4o vision would experience</li>
          <li>Tests both desktop and mobile (390×844 iPhone viewport)</li>
          <li>This is genuinely novel — no competitor does vision-based agent simulation</li>
        </ul>

        <h4 style={{ color: "#059669", marginTop: 16 }}>Browser Agent — Real Navigation <HonestBadge type="real" /></h4>
        <ul>
          <li>Puppeteer with stealth plugin (puppeteer-extra-plugin-stealth) to avoid bot detection</li>
          <li>Actually clicks buttons with <code>page.mouse.click(x, y)</code></li>
          <li>Takes annotated screenshots with step overlays and cursor crosshairs</li>
          <li>Human-agent gap detection: identifies visible elements that programmatic selectors can&apos;t find</li>
        </ul>

        <h4 style={{ color: "#059669", marginTop: 16 }}>Accessibility Agent — Solid Foundation <HonestBadge type="real" /></h4>
        <ul>
          <li>Uses Puppeteer&apos;s built-in accessibility tree API — the same tree screen readers use</li>
          <li>Checks for landmarks (nav, main), headings (h1), and properly labeled interactive elements</li>
          <li>Identifies unlabeled buttons/links that agents can&apos;t understand (missing aria-label, textContent)</li>
          <li>Tests whether key shopping elements (add-to-cart, size selector, price) are findable via accessibility selectors</li>
          <li><em>Limitation: counts focusable elements but doesn&apos;t simulate actual Tab key navigation</em></li>
        </ul>

        <h4 style={{ color: "#059669", marginTop: 16 }}>Feed Agent — Real Gap Finder <HonestBadge type="real" /></h4>
        <ul>
          <li>Probes 9+ common feed paths (Google Merchant XML, Shopify products.json, RSS/Atom)</li>
          <li>Parses discovered feeds and checks for missing fields (title, price, availability, image, GTIN, brand)</li>
          <li>Most e-commerce brands don&apos;t know their feeds are broken or missing — this surfaces real blind spots</li>
          <li><em>Limitation: price consistency check (feed price vs page price) is not yet implemented</em></li>
        </ul>

        <h4 style={{ color: "#0259DD", marginTop: 16 }}>10-Agent Compatibility — Real Access + Modeled Capabilities <HonestBadge type="partial" /></h4>
        <ul>
          <li>We now test with <strong>8 real user-agent strings</strong>: GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Amazonbot, CCBot, Bingbot</li>
          <li>For each user-agent, we check: HTTP status codes, bot-blocking indicators (CAPTCHA pages, access-denied responses), and content stripping (does the site serve reduced content to that bot?)</li>
          <li>If a site blocks GPTBot but allows PerplexityBot, those agents get <strong>genuinely different scores</strong> — this is real differential data, not modeled</li>
          <li>Weight vectors per agent are still used for capability modeling — feed agents weight structured data, browser agents weight UX interaction</li>
          <li>The final per-agent score combines real access testing results with the weighted category projections</li>
          <li>We still do <strong>NOT</strong> simulate each agent&apos;s full interaction patterns (e.g., how Operator clicks through a checkout vs. how Comet does it) — the user-agent test catches blocking/access differences, the weighted model captures capability differences</li>
        </ul>
      </Card>

      <Card title="THE SCORING MATH" color="#7C3AED">
        <p>The scoring engine is deterministic. No randomness, no AI judgment in the math:</p>
        <pre style={{ backgroundColor: "#0A1628", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#CBD5E1", border: "1px solid #1E293B" }}>
{`// Category scores (each 0-100):
discoverability    = f(browser_homepage, browser_nav, a11y_landmarks, visual_clarity)
productUnderstand  = f(schema_product, schema_price, schema_offers, feeds)
navInteraction     = f(cookie_consent, variant_selection, a11y_labeled_ratio)
cartCheckout       = f(add_to_cart_success, checkout_reached, guest_checkout, APIs)
performance        = f(bot_blocking, captcha, load_time)
dataStandards      = f(robots_txt, sitemap, og_tags, json_ld, feeds)
agenticCommerce    = f(acp_support, cart_api, graphql, ucp, llms_txt)

// Overall score:
overall = disc×0.15 + prod×0.20 + nav×0.20 + cart×0.25
        + perf×0.05 + data×0.05 + agen×0.10

// Per-agent score (example: ChatGPT Operator):
operator_score = disc×0.10 + prod×0.10 + nav×0.25 + cart×0.30
               + perf×0.20 + data×0.05 + agen×0.00`}
        </pre>
      </Card>

      <Card title="REAL THINGS WE CHECK THAT COMPETITORS DON'T" color="#FBBA16">
        <ul style={{ lineHeight: 2 }}>
          <li><strong>ACP (Agentic Commerce Protocol)</strong> — probes /.well-known/acp and /checkout_sessions. Almost nobody checks this yet.</li>
          <li><strong>llms.txt</strong> — the emerging standard for LLM-readable site descriptions. We check for it.</li>
          <li><strong>UCP</strong> — Universal Commerce Protocol. Forward-looking, almost no sites have it.</li>
          <li><strong>AI-specific robots.txt rules</strong> — not just generic Googlebot, but GPTBot, ClaudeBot, PerplexityBot, Amazonbot.</li>
          <li><strong>Vision-based CTA detection</strong> — using Claude Vision to test &ldquo;can an AI visually find the buy button?&rdquo;</li>
          <li><strong>Human-agent gap analysis</strong> — detecting elements visible to humans but invisible to programmatic agents.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ================================================================
   CRITICAL AUDIT LEVEL
   ================================================================ */

function CriticalLevel() {
  return (
    <div>
      <Card title="THINGS THAT ARE HONEST" color="#059669">
        <ul style={{ lineHeight: 2 }}>
          <li><HonestBadge type="real" /> We actually navigate the site with a real browser and click real buttons</li>
          <li><HonestBadge type="real" /> We actually parse real structured data from the DOM</li>
          <li><HonestBadge type="real" /> We actually check robots.txt for 8 specific AI bot user agents</li>
          <li><HonestBadge type="real" /> We actually send screenshots to Claude Vision and ask it to find the buy button</li>
          <li><HonestBadge type="real" /> We actually probe for ACP, UCP, llms.txt, and real API endpoints</li>
          <li><HonestBadge type="real" /> We actually parse product feeds and check for missing fields</li>
          <li><HonestBadge type="real" /> The 7-category scoring math is deterministic and reproducible</li>
        </ul>
      </Card>

      <Card title="THINGS THAT ARE MISLEADING" color="#DC2626">
        <h4 style={{ color: "#0259DD" }}>1. &ldquo;10 AI Agent Compatibility&rdquo; <HonestBadge type="partial" /></h4>
        <p><strong>What customers think:</strong> We tested their site with ChatGPT Operator, Perplexity Comet, etc. individually.</p>
        <p><strong>What actually happens now:</strong> One comprehensive scan for the 7 categories, <strong>plus</strong> real per-agent access testing with 8 user-agent strings (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Amazonbot, CCBot, Bingbot). We check HTTP status, bot-blocking indicators, and content stripping for each. The final agent score combines this real access data with the weighted category projections.</p>
        <p><strong>What&apos;s now real:</strong> Access testing — if a site blocks GPTBot but allows PerplexityBot, those agents get genuinely different scores based on real HTTP responses.</p>
        <p><strong>What&apos;s still modeled:</strong> Interaction pattern simulation — we don&apos;t replay how Operator navigates a checkout differently from Comet. The weighted model handles capability differences (feed-based vs. browser-based needs), not behavioral differences.</p>
        <p><strong>Remaining gap:</strong> Full behavioral simulation per agent. This would require running separate Puppeteer sessions mimicking each agent&apos;s specific navigation strategy, which is a much larger effort. The current hybrid approach covers the most impactful difference (access vs. blocked) while modeling the rest.</p>

        <h4 style={{ color: "#DC2626", marginTop: 20 }}>2. &ldquo;Add to Cart Success&rdquo; <HonestBadge type="gap" /></h4>
        <p><strong>What customers think:</strong> The bot successfully added an item to the cart.</p>
        <p><strong>What actually happens:</strong> The bot clicked the add-to-cart button. We don&apos;t verify the cart actually updated (no cart count check, no confirmation modal detection).</p>
        <p><strong>Fix:</strong> After clicking add-to-cart, check for: cart count badge changing, confirmation toast/modal appearing, cart drawer opening, or navigate to /cart and check for items.</p>

        <h4 style={{ color: "#DC2626", marginTop: 20 }}>3. &ldquo;Top 10% / Top 25%&rdquo; Comparisons <HonestBadge type="gap" /></h4>
        <p><strong>What customers think:</strong> Statistical comparison against all scanned brands.</p>
        <p><strong>What actually happens:</strong> Hardcoded brackets. Score 85+ = &ldquo;top 10%&rdquo;. Not based on actual distribution data.</p>
        <p><strong>Fix:</strong> Calculate real percentiles from the database. You have 100+ brands — <code>SELECT COUNT(*) FROM scans WHERE overallScore &lt; ?</code> gives you the real percentile.</p>

        <h4 style={{ color: "#DC2626", marginTop: 20 }}>4. &ldquo;Keyboard Navigation Testing&rdquo; <HonestBadge type="gap" /></h4>
        <p><strong>What customers think:</strong> We simulated tab-key navigation.</p>
        <p><strong>What actually happens:</strong> We count focusable elements. We don&apos;t actually press Tab or verify focus order.</p>
        <p><strong>Fix:</strong> Use <code>page.keyboard.press(&apos;Tab&apos;)</code> in a loop and track which elements receive focus.</p>

        <h4 style={{ color: "#DC2626", marginTop: 20 }}>5. Feed Price Consistency <HonestBadge type="gap" /></h4>
        <p><strong>What the model includes:</strong> A <code>priceConsistency</code> field.</p>
        <p><strong>What actually happens:</strong> Always &ldquo;untested&rdquo;. The code has a TODO comment.</p>
        <p><strong>Fix:</strong> Compare feed price vs. page price vs. schema price for the same product. Flag mismatches.</p>

        <h4 style={{ color: "#DC2626", marginTop: 20 }}>6. Journey Step Durations <HonestBadge type="gap" /></h4>
        <p><strong>What customers see:</strong> Duration for each step (e.g., &ldquo;3.2s&rdquo;).</p>
        <p><strong>What actually happens:</strong> Data agent step durations are hardcoded (500ms, 300ms, etc.), not measured.</p>
        <p><strong>Fix:</strong> Record actual timestamps in the data agent and use real durations.</p>
      </Card>

      <Card title="PRIORITY FIXES TO BECOME BULLETPROOF" color="#FBBA16">
        <p>If a CTO emails you back saying &ldquo;how exactly do you test compatibility with ChatGPT Operator?&rdquo; — right now you can&apos;t give a great answer. Here&apos;s how to fix that, in priority order:</p>

        <div style={{ marginTop: 16 }}>
          <DiagramBox
            label="1. ✅ USER-AGENT TESTING (DONE)"
            description="Now testing with 8 real user-agent strings (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Amazonbot, CCBot, Bingbot). Checks HTTP status, bot-blocking, and content stripping. Each agent's score now incorporates real differential access data."
            color="#059669"
          />
          <DiagramBox
            label="2. VERIFY ADD-TO-CART (half day)"
            description="After clicking the button, check for cart count changes, confirmation modals, or navigate to /cart to verify items were added. Changes addToCartSuccess from 'we clicked it' to 'it worked.'"
            color="#FF6648"
          />
          <DiagramBox
            label="3. REAL PERCENTILE COMPARISONS (half day)"
            description="Replace hardcoded 'top 10%' with actual percentile from your database. You have the data — just query it."
            color="#FBBA16"
          />
          <DiagramBox
            label="4. PRICE CONSISTENCY CHECK (1 day)"
            description="Compare the price from the feed, from Schema.org, and from the visible page. Flag mismatches. This is a real, valuable finding that brands would pay attention to."
            color="#FBBA16"
          />
          <DiagramBox
            label="5. REAL KEYBOARD NAVIGATION (half day)"
            description="Actually press Tab and track focus. This turns a questionable claim into a real test."
            color="#0259DD"
          />
        </div>
      </Card>

      <Card title="WHAT TO SAY WHEN SOMEONE ASKS HARD QUESTIONS" color="#7C3AED">
        <h4 style={{ color: "#FFF8F0" }}>&ldquo;Do you actually test with ChatGPT / Perplexity / Claude?&rdquo;</h4>
        <p><strong>Honest answer:</strong> &ldquo;Yes — we test with each agent&apos;s real user-agent string. We send requests as GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, and others, and check whether your site lets them in, blocks them, or serves them different content. On top of that, we run a comprehensive 5-agent scan that tests structured data, navigation, cart flow, visual clarity, and feed availability. Each agent&apos;s score combines real access results with a capability model — feed-based agents like ChatGPT Shopping need your product data to be machine-readable, browser-based agents like Operator need your checkout to work without human intervention. We test for both.&rdquo;</p>

        <h4 style={{ color: "#FFF8F0", marginTop: 16 }}>&ldquo;How is this different from a Lighthouse audit?&rdquo;</h4>
        <p><strong>Honest answer:</strong> &ldquo;Lighthouse tests performance and accessibility for humans. We test discoverability and usability for AI agents specifically. We check things Lighthouse doesn&apos;t: robots.txt rules for AI bots, Schema.org product markup quality, whether AI can visually identify your buy button, whether your product feeds exist and have complete data, and whether your checkout works without a human clicking through it.&rdquo;</p>

        <h4 style={{ color: "#FFF8F0", marginTop: 16 }}>&ldquo;Isn&apos;t this just a fancy web scraper?&rdquo;</h4>
        <p><strong>Honest answer:</strong> &ldquo;A scraper extracts data. We simulate the AI shopping experience end-to-end — from discovering your products, to understanding them, to attempting a purchase. We use computer vision to test whether multimodal AI can identify your CTAs. We check protocols like ACP that AI commerce platforms are starting to adopt. The value isn&apos;t in the scraping — it&apos;s in the diagnostic framework and the prioritized fix list.&rdquo;</p>
      </Card>

      <Card title="THE BOTTOM LINE" color="#FF6648">
        <p style={{ fontSize: 16, lineHeight: 1.8 }}>
          <strong>Is ARC Report smoke and mirrors?</strong> No. The core scanning is real and valuable. The 5 agents do genuine technical analysis. The Data Agent and Visual Agent are particularly strong differentiators.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8 }}>
          <strong>Is it perfect?</strong> No. The 10-agent compatibility is now much stronger with real per-agent access testing, but we still don&apos;t simulate each agent&apos;s full interaction patterns. The percentile comparisons are fabricated. Some checks are incomplete (add-to-cart verification, keyboard navigation, price consistency).
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8 }}>
          <strong>Is it useful?</strong> Yes. No other product gives e-commerce brands a clear, actionable report on AI agent readiness. The scoring framework is sound. The findings and fix list provide real value. The visual agent approach is genuinely novel.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8 }}>
          <strong>What would make it bulletproof?</strong> Per-agent user-agent testing is now live (the single biggest improvement). Remaining: verify add-to-cart actually works, replace fake percentiles with real data, and eventually add full per-agent behavioral simulation. These remaining items are 2-3 days of work total.
        </p>
      </Card>
    </div>
  );
}

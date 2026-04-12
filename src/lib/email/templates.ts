/**
 * Email templates — ARC Report brand identity.
 *
 * Design language: 1970s NASA × Tokyo retro-futurism.
 * Colors: cream #FFF8F0, cobalt #0259DD, coral #FF6648, mustard #FBBA16,
 *         navy #0A1628, violet #7C3AED, forest #00492C
 * Fonts: system sans-serif fallback (emails can't load custom fonts reliably)
 * Signature moves: offset shadows, uppercase tracking labels, data-num typography
 */

// ── Shared Layout ──────────────────────────────────────────────────

function layout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARC Report</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin: 0; padding: 0; background-color: #FFF8F0; -webkit-font-smoothing: antialiased; }
  * { box-sizing: border-box; }
  .preheader { display: none !important; max-height: 0; overflow: hidden; mso-hide: all; }
</style>
</head>
<body style="margin:0; padding:0; background-color:#FFF8F0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheader ? `<div class="preheader" style="display:none!important;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}

<!-- Accent bar -->
<div style="height:4px; background:linear-gradient(90deg, #0259DD 0%, #FF6648 33%, #FBBA16 66%, #7C3AED 100%);"></div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

<!-- Header -->
<tr><td style="padding:32px 32px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="vertical-align:middle;">
      <!-- Logo mark -->
      <div style="display:inline-block; position:relative; width:28px; height:28px;">
        <div style="position:absolute; top:2px; left:2px; width:28px; height:28px; background-color:#FF6648;"></div>
        <div style="position:relative; width:28px; height:28px; background-color:#0259DD; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#FFFFFF; font-family:monospace;">AR</div>
      </div>
      <span style="margin-left:10px; font-size:15px; font-weight:900; color:#0A1628; letter-spacing:-0.02em;">ARC Report</span>
    </td>
    <td align="right" style="vertical-align:middle;">
      <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#94A3B8; font-family:monospace;">v2.0</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Content -->
<tr><td style="padding:0 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:32px;">
  <div style="border-top:2px solid #E8E0D8; padding-top:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:11px; color:#94A3B8; line-height:1.6;">
        <a href="https://www.arcreport.ai" style="color:#0259DD; text-decoration:none; font-weight:600;">Brands</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.arcreport.ai/changelog" style="color:#94A3B8; text-decoration:none;">Changes</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.arcreport.ai/pricing" style="color:#94A3B8; text-decoration:none;">Pricing</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.arcreport.ai/account" style="color:#94A3B8; text-decoration:none;">Account</a>
      </td>
    </tr>
    <tr>
      <td style="padding-top:12px; font-size:10px; color:#CBD5E1; line-height:1.5;">
        AI agent intelligence for e-commerce. Updated daily.<br>
        &copy; ${new Date().getFullYear()} ARC Report
      </td>
    </tr>
    </table>
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Reusable Components ────────────────────────────────────────────

function sectionLabel(text: string): string {
  return `<div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.18em; color:#94A3B8; font-family:monospace; margin-bottom:8px;">${text}</div>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px; font-size:28px; font-weight:900; color:#0A1628; line-height:1.2; letter-spacing:-0.02em;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<h2 style="margin:24px 0 12px; font-size:18px; font-weight:900; color:#0A1628; line-height:1.3;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px; font-size:15px; color:#475569; line-height:1.7;">${text}</p>`;
}

function ctaButton(text: string, href: string, color: string = "#0259DD"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td>
  <div style="display:inline-block; position:relative;">
    <div style="position:absolute; top:3px; left:3px; background-color:${color === "#0259DD" ? "#FF6648" : "#0259DD"}; padding:14px 28px; font-size:13px;">&#8203;</div>
    <a href="${href}" style="position:relative; display:inline-block; padding:14px 28px; background-color:${color}; color:#FFFFFF; font-size:13px; font-weight:800; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-family:monospace; border:2px solid #0A1628;">${text}</a>
  </div>
</td></tr>
</table>`;
}

function statBlock(stats: Array<{ value: string; label: string; color: string }>): string {
  const cells = stats.map(s => `
    <td style="padding:16px 20px; background-color:#FFFFFF; border:2px solid #0A1628; vertical-align:top;">
      <div style="position:relative;">
        <div style="font-size:32px; font-weight:900; color:${s.color}; font-family:monospace; letter-spacing:-0.02em;">${s.value}</div>
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#94A3B8; margin-top:4px;">${s.label}</div>
      </div>
    </td>
  `).join('<td style="width:12px;"></td>');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
<tr>${cells}</tr>
</table>`;
}

function changeRow(brandName: string, brandSlug: string, field: string, oldValue: string, newValue: string): string {
  return `<tr>
  <td style="padding:12px 16px; border-bottom:1px solid #E8E0D8; vertical-align:top;">
    <a href="https://www.arcreport.ai/brand/${brandSlug}" style="font-size:14px; font-weight:700; color:#0A1628; text-decoration:none;">${brandName}</a>
    <div style="margin-top:4px;">
      <span style="font-size:12px; font-weight:600; color:#0A1628; font-family:monospace;">${field}</span>
      <span style="font-size:12px; color:#94A3B8;">&nbsp;&mdash;&nbsp;</span>
      <span style="font-size:11px; font-family:monospace; background-color:#FEE2E2; color:#DC2626; padding:2px 6px;">${oldValue || "none"}</span>
      <span style="font-size:12px; color:#94A3B8;">&nbsp;&rarr;&nbsp;</span>
      <span style="font-size:11px; font-family:monospace; background-color:#DCFCE7; color:#16A34A; padding:2px 6px;">${newValue || "none"}</span>
    </div>
  </td>
</tr>`;
}

function dividerLine(color: string = "#E8E0D8"): string {
  return `<div style="height:2px; background-color:${color}; margin:24px 0;"></div>`;
}

function cardBlock(content: string, borderColor: string = "#0A1628"): string {
  return `<div style="position:relative; margin:20px 0;">
  <div style="position:absolute; top:4px; left:4px; right:-4px; bottom:-4px; background-color:${borderColor === "#0A1628" ? "#E8E0D8" : borderColor}; opacity:0.3;"></div>
  <div style="position:relative; background-color:#FFFFFF; border:2px solid ${borderColor}; padding:24px;">
    ${content}
  </div>
</div>`;
}

// ── Email Templates ────────────────────────────────────────────────

export interface WelcomeEmailData {
  name: string | null;
  plan: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const greeting = data.name ? `Welcome, ${data.name}.` : "Welcome to ARC Report.";
  const isPaid = data.plan !== "free";

  const content = `
    ${sectionLabel("Transmission received")}
    ${heading(greeting)}
    ${paragraph("You now have access to the most comprehensive index of AI agent access policies across 1,000+ e-commerce brands. Updated daily.")}

    ${cardBlock(`
      ${sectionLabel("Your plan")}
      <div style="font-size:24px; font-weight:900; color:#0259DD; margin:8px 0 4px;">${data.plan === "agency" ? "Agency" : data.plan === "pro" ? "Pro" : "Free"}</div>
      <div style="font-size:13px; color:#475569;">
        ${isPaid
          ? "Watchlists, daily alerts, full history, and exports are active."
          : "Full index access. Upgrade anytime for watchlists and alerts."
        }
      </div>
    `, "#0259DD")}

    ${subheading("Three things to do first")}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 01</div>
      <a href="https://www.arcreport.ai" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">Browse the index &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">See which brands are open to AI agents and which are blocking them. Filter by category, platform, or access status.</div>
    `)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 02</div>
      <a href="https://www.arcreport.ai" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">Today's top movers &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">See which brands changed posture toward AI agents today — opened, closed, or flipped a major bot.</div>
    `)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 03</div>
      <a href="${isPaid ? "https://www.arcreport.ai/account/watchlist" : "https://www.arcreport.ai/signup"}" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">Set up your watchlist &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">${isPaid
        ? "Track up to " + (data.plan === "agency" ? "50" : "10") + " brands and get daily email alerts when their agent access policy changes."
        : "Upgrade to Pro to track specific brands and get alerted the day their agent access changes."
      }</div>
    `)}

    ${ctaButton("Open the index", "https://www.arcreport.ai")}

    ${dividerLine()}
    ${paragraph('<span style="font-size:13px; color:#94A3B8;">Questions? Reply to this email. It goes to a real person.</span>')}
  `;

  return {
    subject: isPaid ? `You're in — ARC Report ${data.plan === "agency" ? "Agency" : "Pro"} is active` : "Welcome to ARC Report",
    html: layout(content, "Your AI agent intelligence dashboard is ready."),
    text: `${greeting}\n\nYou now have access to the most comprehensive index of AI agent access policies across 1,000+ e-commerce brands.\n\nStart here: https://www.arcreport.ai\n\nQuestions? Reply to this email.`,
  };
}

export interface WatchlistAlertData {
  name: string | null;
  changes: Array<{
    brandName: string;
    brandSlug: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

export function watchlistAlertEmail(data: WatchlistAlertData): { subject: string; html: string; text: string } {
  const brandCount = new Set(data.changes.map(c => c.brandSlug)).size;
  const changeCount = data.changes.length;

  const changeRows = data.changes.map(c =>
    changeRow(c.brandName, c.brandSlug, c.field, c.oldValue ?? "none", c.newValue ?? "none")
  ).join("");

  const content = `
    ${sectionLabel("Watchlist alert")}
    ${heading(`${changeCount} change${changeCount === 1 ? "" : "s"} detected`)}
    ${paragraph(`${brandCount} brand${brandCount === 1 ? "" : "s"} on your watchlist ${brandCount === 1 ? "has" : "have"} new activity.`)}

    ${statBlock([
      { value: String(changeCount), label: "Changes", color: "#FF6648" },
      { value: String(brandCount), label: "Brands", color: "#0259DD" },
    ])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:2px solid #0A1628; margin:20px 0;">
      <tr><td style="padding:16px 16px 8px;">
        ${sectionLabel("Today's changes")}
      </td></tr>
      ${changeRows}
    </table>

    ${ctaButton("View your watchlist", "https://www.arcreport.ai/account/watchlist")}

    ${dividerLine()}
    <div style="font-size:11px; color:#94A3B8; line-height:1.5;">
      You're receiving this because you have an active ARC Report watchlist.
      <a href="https://www.arcreport.ai/account/watchlist" style="color:#0259DD; text-decoration:none;">Manage your watchlist</a>
    </div>
  `;

  return {
    subject: `ARC Alert: ${changeCount} change${changeCount === 1 ? "" : "s"} on your watchlist`,
    html: layout(content, `${changeCount} changes detected across ${brandCount} brands you're tracking.`),
    text: `Watchlist Alert\n\n${changeCount} changes detected:\n\n${data.changes.map(c => `- ${c.brandName}: ${c.field} changed from "${c.oldValue ?? "none"}" to "${c.newValue ?? "none"}"`).join("\n")}\n\nView your watchlist: https://www.arcreport.ai/account/watchlist`,
  };
}

export interface WeeklyDigestData {
  totalChanges: number;
  brandsMoving: number;
  topMovers: Array<{ brandName: string; brandSlug: string; changeCount: number }>;
  notableChanges: Array<{
    brandName: string;
    brandSlug: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

export function weeklyDigestEmail(data: WeeklyDigestData): { subject: string; html: string; text: string } {
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const moverRows = data.topMovers.slice(0, 5).map((m, i) => `
    <tr>
      <td style="padding:10px 16px; border-bottom:1px solid #E8E0D8; vertical-align:middle;">
        <span style="font-size:20px; font-weight:900; color:#FF6648; font-family:monospace; margin-right:12px;">${String(i + 1).padStart(2, "0")}</span>
        <a href="https://www.arcreport.ai/brand/${m.brandSlug}" style="font-size:14px; font-weight:700; color:#0A1628; text-decoration:none;">${m.brandName}</a>
      </td>
      <td align="right" style="padding:10px 16px; border-bottom:1px solid #E8E0D8; vertical-align:middle;">
        <span style="font-size:12px; font-weight:700; color:#0259DD; font-family:monospace;">${m.changeCount} changes</span>
      </td>
    </tr>
  `).join("");

  const notableRows = data.notableChanges.slice(0, 8).map(c =>
    changeRow(c.brandName, c.brandSlug, c.field, c.oldValue ?? "none", c.newValue ?? "none")
  ).join("");

  const content = `
    ${sectionLabel(`Weekly digest &mdash; ${dateStr}`)}
    ${heading("This week in agentic commerce")}
    ${paragraph("What shifted across 1,000+ brand scans this week. The signals that matter, the noise filtered out.")}

    ${statBlock([
      { value: String(data.totalChanges), label: "Total changes", color: "#FF6648" },
      { value: String(data.brandsMoving), label: "Brands moving", color: "#0259DD" },
    ])}

    ${data.topMovers.length > 0 ? `
      ${subheading("Top movers")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:2px solid #0A1628; margin:12px 0;">
        ${moverRows}
      </table>
    ` : ""}

    ${data.notableChanges.length > 0 ? `
      ${subheading("Notable changes")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:2px solid #0A1628; margin:12px 0;">
        ${notableRows}
      </table>
    ` : ""}

    ${ctaButton("See what's changing", "https://www.arcreport.ai/changelog")}

    ${cardBlock(`
      ${sectionLabel("Go deeper")}
      <div style="font-size:14px; color:#475569; line-height:1.7;">
        Want daily alerts on specific brands instead of a weekly summary?
        <a href="https://www.arcreport.ai/pricing" style="color:#0259DD; text-decoration:none; font-weight:700;">Upgrade to Pro</a>
        for watchlists and real-time change alerts.
      </div>
    `, "#FBBA16")}

    ${dividerLine()}
    <div style="font-size:11px; color:#94A3B8; line-height:1.5;">
      You subscribed to the ARC Report weekly digest.
      <a href="https://www.arcreport.ai" style="color:#0259DD; text-decoration:none;">Visit ARC Report</a>
    </div>
  `;

  return {
    subject: `ARC Weekly: ${data.totalChanges} changes across ${data.brandsMoving} brands`,
    html: layout(content, `${data.totalChanges} changes this week. ${data.topMovers[0]?.brandName ?? "See"} was the top mover.`),
    text: `This Week in Agentic Commerce\n\n${data.totalChanges} total changes across ${data.brandsMoving} brands.\n\nTop movers:\n${data.topMovers.slice(0, 5).map((m, i) => `${i + 1}. ${m.brandName} (${m.changeCount} changes)`).join("\n")}\n\nSee what's changing: https://www.arcreport.ai/changelog`,
  };
}

export interface OnboardingDay2Data {
  name: string | null;
  plan: string;
}

export function onboardingDay2Email(data: OnboardingDay2Data): { subject: string; html: string; text: string } {
  const greeting = data.name ? `Hey ${data.name},` : "Hey there,";
  const isPaid = data.plan !== "free";

  const content = `
    ${sectionLabel("Day 2")}
    ${heading("3 things to check on ARC Report today")}
    ${paragraph(`${greeting} it's been a couple of days — here's where to go next.`)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 01</div>
      <a href="${isPaid ? "https://www.arcreport.ai/account/watchlist" : "https://www.arcreport.ai"}" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">${isPaid ? "Set up your first watchlist" : "Explore a brand page"} &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">${isPaid
        ? "Pick the brands you care about and we'll email you the moment their AI agent access policy changes. Takes 30 seconds."
        : "Search for any brand and see exactly how AI agents interact with their site — what's open, what's blocked, and what signals they publish."
      }</div>
    `)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 02</div>
      <a href="https://www.arcreport.ai" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">Browse the index &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">See which brands are open to AI agents and which are blocking them. Filter by category, platform, or access status.</div>
    `)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 03</div>
      <a href="https://www.arcreport.ai/changelog" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">See what changed today &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">Every brand posture change, every day. Who opened up, who locked down, which agents got flipped.</div>
    `)}

    ${ctaButton(isPaid ? "Open your watchlist" : "Browse the index", isPaid ? "https://www.arcreport.ai/account/watchlist" : "https://www.arcreport.ai")}

    ${dividerLine()}
    ${paragraph('<span style="font-size:13px; color:#94A3B8;">Reply to this email anytime — it goes to a real person.</span>')}
  `;

  return {
    subject: "3 things to check on ARC Report today",
    html: layout(content, "Quick ways to get value from your ARC Report account."),
    text: `${greeting} it's been a couple of days — here's where to go next.\n\n1. ${isPaid ? "Set up your first watchlist: https://www.arcreport.ai/account/watchlist" : "Explore a brand page: https://www.arcreport.ai"}\n2. Browse the index: https://www.arcreport.ai\n3. See what changed today: https://www.arcreport.ai/changelog\n\nReply to this email anytime.`,
  };
}

export interface OnboardingDay5Data {
  name: string | null;
  plan: string;
}

export function onboardingDay5Email(data: OnboardingDay5Data): { subject: string; html: string; text: string } {
  const greeting = data.name ? `${data.name}, heads up` : "Heads up";
  const isPaid = data.plan !== "free";

  const content = `
    ${sectionLabel("Day 5")}
    ${heading("Your first weekly digest is coming Sunday")}
    ${paragraph(`${greeting} — this Sunday you'll receive your first ARC Report weekly digest. Here's what to expect.`)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 01</div>
      <div style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px;">What's in the weekly digest</div>
      <div style="font-size:13px; color:#475569; line-height:1.6;">Every Sunday you'll get a summary of the week's biggest shifts: total changes across 1,000+ brands, the top movers, and notable policy changes — all in one email.</div>
    `)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 02</div>
      <div style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px;">${isPaid ? "Are your watchlist alerts set up?" : "Want daily alerts instead?"}</div>
      <div style="font-size:13px; color:#475569; line-height:1.6;">${isPaid
        ? "The weekly digest covers the whole index — but your watchlist alerts are the real-time signal. If you haven't added brands yet, now's the time."
        : "The weekly digest gives you the full picture. Upgrade to Pro to track specific brands and get notified the same day their AI agent policy changes."
      }</div>
    `, isPaid ? "#0A1628" : "#FBBA16")}

    ${ctaButton(isPaid ? "Manage your watchlist" : "See Pro features", isPaid ? "https://www.arcreport.ai/account/watchlist" : "https://www.arcreport.ai/pricing", isPaid ? "#0259DD" : "#FF6648")}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 03</div>
      <a href="https://www.arcreport.ai/changelog" style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px; display:block; text-decoration:none;">See what's changing daily &rarr;</a>
      <div style="font-size:13px; color:#475569; line-height:1.6;">The running log of every brand posture change, every day. What the weekly summarizes.</div>
    `)}

    ${dividerLine()}
    ${paragraph('<span style="font-size:13px; color:#94A3B8;">Questions? Reply to this email — it goes to a real person.</span>')}
  `;

  return {
    subject: "Your first weekly digest is coming Sunday",
    html: layout(content, "This Sunday: your first ARC Report weekly digest."),
    text: `${greeting} — this Sunday you'll receive your first ARC Report weekly digest.\n\nWhat to expect: a summary of the week's biggest shifts across 1,000+ brands, top movers, and notable policy changes.\n\n${isPaid ? "Make sure your watchlist is set up: https://www.arcreport.ai/account/watchlist" : "Want daily alerts? See Pro features: https://www.arcreport.ai/pricing"}\n\nSee what's changing daily: https://www.arcreport.ai/changelog\n\nReply to this email anytime.`,
  };
}

export interface BrandClaimData {
  brandName: string;
  brandSlug: string;
}

export function brandClaimEmail(data: BrandClaimData): { subject: string; html: string; text: string } {
  const content = `
    ${sectionLabel("Brand claim received")}
    ${heading(`You claimed ${data.brandName}.`)}
    ${paragraph(`We've noted your interest in managing ${data.brandName}'s profile on ARC Report. Here's what that means.`)}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 01</div>
      <div style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px;">Your brand's live readout</div>
      <div style="font-size:13px; color:#475569; line-height:1.6;">See exactly how AI agents like ChatGPT, Claude, and Perplexity interact with ${data.brandName} &mdash; what's open, what's blocked, and what machine-readable signals you're publishing.</div>
    `)}

    ${ctaButton(`View ${data.brandName}'s readout`, `https://www.arcreport.ai/brand/${data.brandSlug}`, "#0259DD")}

    ${cardBlock(`
      <div style="font-size:14px; font-weight:900; color:#FF6648; font-family:monospace; margin-bottom:8px;">/ 02</div>
      <div style="font-size:15px; font-weight:700; color:#0A1628; margin-bottom:4px;">Get alerted when things change</div>
      <div style="font-size:13px; color:#475569; line-height:1.6;">With a Pro account, you can add ${data.brandName} to your watchlist and get a daily email whenever the agent access policy, structured data, or platform infrastructure changes.</div>
    `)}

    ${ctaButton("Set up watchlist alerts", "https://www.arcreport.ai/pricing", "#FF6648")}

    ${dividerLine()}
    ${paragraph('<span style="font-size:13px; color:#94A3B8;">Want to discuss your brand\'s AI agent strategy? Reply to this email &mdash; we read everything.</span>')}
  `;

  return {
    subject: `${data.brandName} — your ARC Report brand claim`,
    html: layout(content, `You claimed ${data.brandName} on ARC Report. See your brand's live AI agent readout.`),
    text: `You claimed ${data.brandName} on ARC Report.\n\nView your brand's readout: https://www.arcreport.ai/brand/${data.brandSlug}\n\nWant daily alerts? Set up a watchlist: https://www.arcreport.ai/pricing\n\nReply to this email with any questions.`,
  };
}

/**
 * Generate a prioritized cold outreach list from scan data.
 *
 * Outputs a CSV with brand name, URL, score, grade, top issues,
 * and a pre-written email subject line.
 *
 * Usage:
 *   npx tsx scripts/generate-outreach-list.ts
 *   npx tsx scripts/generate-outreach-list.ts --category=fashion
 *   npx tsx scripts/generate-outreach-list.ts --max-score=60
 *   npx tsx scripts/generate-outreach-list.ts --min-score=20 --max-score=50
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const filterCategory = args.find((a) => a.startsWith("--category="))?.split("=")[1];
  const maxScore = parseInt(args.find((a) => a.startsWith("--max-score="))?.split("=")[1] ?? "70");
  const minScore = parseInt(args.find((a) => a.startsWith("--min-score="))?.split("=")[1] ?? "0");

  const { db, schema } = await import(path.join(projectRoot, "src/lib/db/index"));
  const { eq, desc } = await import("drizzle-orm");

  // Get all active brands with latest scores
  const brands = db
    .select({
      id: schema.brands.id,
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      category: schema.brands.category,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  const rows: Array<{
    name: string;
    url: string;
    category: string;
    score: number;
    grade: string;
    issueCount: number;
    topIssues: string;
    subject: string;
    slug: string;
  }> = [];

  for (const brand of brands) {
    if (filterCategory && brand.category !== filterCategory) continue;

    const latestScan = db
      .select({
        overallScore: schema.scans.overallScore,
        grade: schema.scans.grade,
        reportJson: schema.scans.reportJson,
      })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1)
      .get();

    if (!latestScan) continue;
    if (latestScan.overallScore > maxScore || latestScan.overallScore < minScore) continue;

    let issueCount = 0;
    let topIssues = "";
    try {
      const report = JSON.parse(latestScan.reportJson);
      issueCount = report.findings?.length ?? 0;
      topIssues = (report.findings ?? [])
        .slice(0, 3)
        .map((f: { title: string }) => f.title)
        .join(" | ");
    } catch { /* skip */ }

    // Generate personalized subject line
    const subject = latestScan.overallScore < 30
      ? `${brand.name}: AI agents can't shop your site (Score: ${latestScan.overallScore}/100)`
      : latestScan.overallScore < 50
        ? `${brand.name} scores ${latestScan.overallScore}/100 for AI shopping readiness`
        : `${brand.name}: ${issueCount} issues blocking AI agents from buying`;

    rows.push({
      name: brand.name,
      url: brand.url,
      category: brand.category,
      score: latestScan.overallScore,
      grade: latestScan.grade,
      issueCount,
      topIssues,
      subject,
      slug: brand.slug,
    });
  }

  // Sort by score ascending (worst scores = most compelling outreach)
  rows.sort((a, b) => a.score - b.score);

  // Output CSV
  const csvHeader = "Name,URL,Category,Score,Grade,Issues,Top Issues,Subject Line,Report URL";
  const csvRows = rows.map((r) =>
    `"${r.name}","${r.url}","${r.category}",${r.score},${r.grade},${r.issueCount},"${r.topIssues.replace(/"/g, '""')}","${r.subject.replace(/"/g, '""')}","https://arcreport.ai/brand/${r.slug}"`
  );

  const csv = [csvHeader, ...csvRows].join("\n");
  const outputPath = path.join(projectRoot, "data", "outreach-list.csv");
  fs.writeFileSync(outputPath, csv);

  console.log(`\n=== Outreach List Generated ===`);
  console.log(`Brands: ${rows.length}`);
  console.log(`Score range: ${minScore}-${maxScore}`);
  if (filterCategory) console.log(`Category: ${filterCategory}`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`\nTop 10 prospects (worst scores = hottest leads):`);

  rows.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} — ${r.score}/100 (${r.grade}) — ${r.issueCount} issues`);
  });

  // Also generate email templates
  const templatePath = path.join(projectRoot, "data", "outreach-templates.md");
  const templates = `# Cold Outreach Templates

## Template 1: The Report Drop (Best performer — leads with value)

Subject: {{subject}}

Hey —

We ran {{brand}} through our AI shopping agent test (arcreport.ai).

Your score: {{score}}/100.

We sent 5 AI agents to try to buy from {{url}} — the same kind of
agents your customers are starting to use (ChatGPT Shopping, Google AI Mode,
Perplexity). Here's what they found:

{{top3issues}}

Full score breakdown: {{reportUrl}}

The good news: most of these are quick fixes. The top 3 alone could
get you to {{estimatedScore}}/100.

If you want the full findings with fix instructions, that's on our
Pro plan ($149/mo) — but the score and category breakdown are free
to check right now.

Best,
[Your name]
ARC Report — arcreport.ai

---

## Template 2: The Competitor Angle (Use when their competitor scores higher)

Subject: {{competitorName}} scores {{competitorScore}}/100 for AI shopping. {{brand}} scores {{score}}.

Hey —

Quick one: we track how well AI shopping agents can buy from
e-commerce sites. Your competitor {{competitorName}} scores
{{competitorScore}}/100. {{brand}} scores {{score}}/100.

That means when someone asks ChatGPT to "buy me running shoes,"
the agent can buy from {{competitorName}} but gets stuck on your site.

Your free score + breakdown: {{reportUrl}}

Best,
[Your name]

---

## Template 3: The Short & Direct (For busy people)

Subject: {{brand}}: {{issueCount}} things blocking AI agents from buying

We scanned {{url}} — AI shopping agents found {{issueCount}} issues.

Score: {{score}}/100. Free breakdown: {{reportUrl}}

Most fixes take hours, not weeks.

[Your name]
arcreport.ai

---

## Where to Find Emails

1. **LinkedIn** — Search "Head of E-commerce" or "Head of Digital" at the brand.
   Don't connect-and-pitch. Find their email via:
2. **Hunter.io** (free: 25 lookups/mo) — enter the domain, get email patterns
3. **Apollo.io** (free: 100 emails/mo) — search by company + title
4. **Google** — "[brand name] head of ecommerce email" sometimes works
5. **Brand website** — check /about, /contact, /team pages

## Best Targets by Title

- Head of E-commerce / Digital Commerce
- VP Digital / VP E-commerce
- Director of Product (if DTC brand)
- CTO / Head of Engineering (for technical fixes)
- CMO / Head of Marketing (for bigger brands)

## Sending Tips

- Send from your personal email (you@arcreport.ai)
- 10-20/day max (keeps you under spam radar)
- Best time: Tuesday-Thursday, 8-10am their timezone
- Follow up once after 3 days if no reply — then move on
- Track in a simple spreadsheet: Brand, Email, Date Sent, Reply Y/N
`;

  fs.writeFileSync(templatePath, templates);
  console.log(`\nEmail templates saved to: ${templatePath}`);
}

main().catch(console.error);

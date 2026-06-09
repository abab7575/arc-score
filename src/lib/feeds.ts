/**
 * RSS/Atom feed builders (E2): changelog entries and weekly digests.
 */

import { getChangelogWithBrands } from "@/lib/index-data";
import { getArchiveWeeks, buildWeeklyDigest } from "@/lib/weekly";
import { SITE_URL, SITE_NAME } from "@/lib/site";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function changelogItems(limit = 100) {
  return getChangelogWithBrands(limit).map((e) => ({
    title: `${e.brandName}: ${e.field} changed from ${e.oldValue ?? "none"} to ${e.newValue ?? "none"}`,
    link: `${SITE_URL}/changelog/${e.id}`,
    guid: `${SITE_URL}/changelog/${e.id}`,
    date: new Date(e.detectedAt),
    description: `${e.brandName} (${e.brandSlug}) — ${e.field}: ${e.oldValue ?? "none"} → ${e.newValue ?? "none"}. Confirmed by ARC Report's daily scan.`,
  }));
}

export function changelogRss(): string {
  const items = changelogItems();
  const lastBuild = (items[0]?.date ?? new Date()).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE_NAME)} — Agent Access Changelog</title>
  <link>${SITE_URL}/changelog</link>
  <atom:link href="${SITE_URL}/changelog.xml" rel="self" type="application/rss+xml"/>
  <description>Confirmed AI agent access changes across 1,000+ e-commerce brands, from ARC Report's daily scan.</description>
  <language>en</language>
  <lastBuildDate>${lastBuild}</lastBuildDate>
${items
  .map(
    (i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.link}</link>
    <guid isPermaLink="true">${i.guid}</guid>
    <pubDate>${i.date.toUTCString()}</pubDate>
    <description>${esc(i.description)}</description>
  </item>`,
  )
  .join("\n")}
</channel>
</rss>
`;
}

export function changelogAtom(): string {
  const items = changelogItems();
  const updated = (items[0]?.date ?? new Date()).toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(SITE_NAME)} — Agent Access Changelog</title>
  <link href="${SITE_URL}/changelog"/>
  <link href="${SITE_URL}/changelog.atom" rel="self"/>
  <id>${SITE_URL}/changelog</id>
  <updated>${updated}</updated>
${items
  .map(
    (i) => `  <entry>
    <title>${esc(i.title)}</title>
    <link href="${i.link}"/>
    <id>${i.guid}</id>
    <updated>${i.date.toISOString()}</updated>
    <summary>${esc(i.description)}</summary>
  </entry>`,
  )
  .join("\n")}
</feed>
`;
}

export function weeklyRss(): string {
  const weeks = getArchiveWeeks().slice(0, 26);
  const items = weeks.map((w) => {
    const digest = buildWeeklyDigest(w);
    return {
      title: `Week of ${w}: ${digest.totalChanges} confirmed agent-access changes across ${digest.brandsMoving} brands`,
      link: `${SITE_URL}/weekly/${w}`,
      date: new Date(`${digest.weekEnd}T23:59:59Z`),
      description: digest.prose.join(" "),
    };
  });
  const lastBuild = (items[0]?.date ?? new Date()).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE_NAME)} — Weekly Agent Access Digest</title>
  <link>${SITE_URL}/weekly</link>
  <atom:link href="${SITE_URL}/weekly.xml" rel="self" type="application/rss+xml"/>
  <description>One summary per week: the biggest blocks, opens, and platform shifts in AI agent access across e-commerce.</description>
  <language>en</language>
  <lastBuildDate>${lastBuild}</lastBuildDate>
${items
  .map(
    (i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.link}</link>
    <guid isPermaLink="true">${i.link}</guid>
    <pubDate>${i.date.toUTCString()}</pubDate>
    <description>${esc(i.description)}</description>
  </item>`,
  )
  .join("\n")}
</channel>
</rss>
`;
}

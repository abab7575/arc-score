import { getBrandBySlug, getLatestLightweightScan } from "@/lib/db/queries";
import { computeArcScore, arcScoreLabel } from "@/lib/scoring/arc-score";

export const revalidate = 3600;

function svg(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function badgeSvg(opts: { label: string; score: string; status: string; color: string; date?: string }): string {
  const { label, score, status, color, date } = opts;
  const labelW = 78;
  const scoreW = 46;
  const statusW = Math.max(status.length * 6.8 + 14, 50);
  const dateW = date ? date.length * 6 + 12 : 0;
  const w = labelW + scoreW + statusW + dateW;
  const h = 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${esc(label)}: ${esc(score)} ${esc(status)}">
  <title>${esc(label)}: ${esc(score)}/100 — ${esc(status)}</title>
  <rect width="${labelW}" height="${h}" fill="#0A1628"/>
  <rect x="${labelW}" width="${scoreW}" height="${h}" fill="${color}"/>
  <rect x="${labelW + scoreW}" width="${statusW}" height="${h}" fill="#1F2937"/>
  ${date ? `<rect x="${labelW + scoreW + statusW}" width="${dateW}" height="${h}" fill="#374151"/>` : ""}
  <g font-family="Verdana,DejaVu Sans,sans-serif" font-size="10" fill="#fff">
    <text x="${labelW / 2}" y="14.5" text-anchor="middle" font-weight="bold">ARC Score</text>
    <text x="${labelW + scoreW / 2}" y="14.5" text-anchor="middle" font-weight="bold">${esc(score)}</text>
    <text x="${labelW + scoreW + statusW / 2}" y="14.5" text-anchor="middle">${esc(status)}</text>
    ${date ? `<text x="${labelW + scoreW + statusW + dateW / 2}" y="14.5" text-anchor="middle" fill="#D1D5DB">${esc(date)}</text>` : ""}
  </g>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.svg$/, "");
  const brand = getBrandBySlug(slug);
  if (!brand) {
    return svg(badgeSvg({ label: "ARC Score", score: "?", status: "unknown brand", color: "#6B7280" }), 404);
  }
  const scan = getLatestLightweightScan(brand.id);
  if (!scan) {
    return svg(badgeSvg({ label: "ARC Score", score: "—", status: "not scanned", color: "#6B7280" }));
  }
  const score = computeArcScore(scan);
  const { label, color } = arcScoreLabel(score.total);
  return svg(
    badgeSvg({
      label: "ARC Score",
      score: String(score.total),
      status: label,
      color,
      date: scan.scannedAt.split("T")[0],
    }),
  );
}

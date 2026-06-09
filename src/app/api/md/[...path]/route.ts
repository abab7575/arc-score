import {
  matrixMarkdown,
  leaderboardMarkdown,
  changelogMarkdown,
  insightsMarkdown,
  brandMarkdown,
  methodologyMarkdown,
} from "@/lib/markdown-pages";

export const revalidate = 3600;

const PAGES: Record<string, () => string> = {
  matrix: matrixMarkdown,
  leaderboard: leaderboardMarkdown,
  changelog: changelogMarkdown,
  insights: insightsMarkdown,
  methodology: methodologyMarkdown,
};

function md(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (path.length === 1 && PAGES[path[0]]) {
    return md(PAGES[path[0]]());
  }
  if (path.length === 2 && path[0] === "brand") {
    const body = brandMarkdown(path[1]);
    if (body) return md(body);
    return md(`# Not found\n\nNo brand with slug \`${path[1]}\`. Try /matrix.md for the full list.\n`, 404);
  }
  return md(
    `# Not found\n\nMarkdown variants exist for: ${Object.keys(PAGES).map((p) => `/${p}.md`).join(", ")}, and /brand/<slug>.md\n`,
    404,
  );
}

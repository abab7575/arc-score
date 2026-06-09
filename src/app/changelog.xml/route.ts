import { changelogRss } from "@/lib/feeds";

export const revalidate = 3600;

export async function GET() {
  return new Response(changelogRss(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

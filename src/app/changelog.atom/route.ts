import { changelogAtom } from "@/lib/feeds";

export const revalidate = 3600;

export async function GET() {
  return new Response(changelogAtom(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

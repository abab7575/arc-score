import { SITE_URL } from "@/lib/site";

export function publicUrl(path: string): URL {
  return new URL(path, SITE_URL);
}

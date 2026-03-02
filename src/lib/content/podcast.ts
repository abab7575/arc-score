/**
 * Podcast content extractor — extracts show notes and transcript text
 * from podcast RSS description/content fields.
 */

/**
 * Clean HTML from podcast descriptions to get plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract show notes / transcript text from podcast RSS item content.
 * Many podcasts include full show notes or transcript links in their
 * RSS <description> or <content:encoded> fields.
 */
export function extractPodcastContent(item: {
  content?: string;
  contentSnippet?: string;
  "content:encoded"?: string;
  summary?: string;
  description?: string;
}): {
  showNotes: string;
  wordCount: number;
  hasTranscript: boolean;
} {
  // Try content:encoded first (richest content), then content, then description
  const rawContent =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    item.summary ||
    "";

  const showNotes = stripHtml(rawContent);
  const wordCount = showNotes.split(/\s+/).filter(Boolean).length;

  // Heuristic: show notes > 500 words likely contain transcript or detailed notes
  const hasTranscript = wordCount > 500;

  return {
    showNotes,
    wordCount,
    hasTranscript,
  };
}

/**
 * Extract podcast episode duration from itunes:duration format.
 * Handles formats: "HH:MM:SS", "MM:SS", or seconds as integer.
 */
export function parsePodcastDuration(duration: string | undefined): number | null {
  if (!duration) return null;

  // If it's just a number, treat as seconds
  if (/^\d+$/.test(duration)) {
    return parseInt(duration);
  }

  // Parse HH:MM:SS or MM:SS format
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return null;
}

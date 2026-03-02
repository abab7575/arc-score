/**
 * YouTube transcript fetcher — extracts auto-generated or uploaded transcripts
 * from YouTube videos using the youtube-transcript package.
 */

/**
 * Extract YouTube video ID from various URL formats.
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch transcript for a YouTube video.
 * Returns the full transcript text, or null if unavailable.
 */
export async function fetchYouTubeTranscript(videoUrl: string): Promise<{
  transcript: string | null;
  wordCount: number;
  needsSummary: boolean;
}> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return { transcript: null, wordCount: 0, needsSummary: false };
  }

  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const segments = await YoutubeTranscript.fetchTranscript(videoId);

    if (!segments || segments.length === 0) {
      return { transcript: null, wordCount: 0, needsSummary: false };
    }

    const transcript = segments.map((s) => s.text).join(" ");
    const wordCount = transcript.split(/\s+/).length;

    return {
      transcript,
      wordCount,
      needsSummary: wordCount > 2000,
    };
  } catch {
    // Transcript not available (private video, no captions, etc.)
    return { transcript: null, wordCount: 0, needsSummary: false };
  }
}

/**
 * Get YouTube video thumbnail URL.
 */
export function getYouTubeThumbnail(videoUrl: string): string | null {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

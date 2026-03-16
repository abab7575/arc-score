/**
 * Reddit fetcher — uses Reddit's free JSON API for public subreddits.
 * No API key needed, just a proper User-Agent header.
 */

export interface RedditPost {
  title: string;
  url: string;
  selftext: string;
  author: string;
  score: number;
  created_utc: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
  thumbnail: string;
}

export async function fetchRedditPosts(jsonUrl: string): Promise<RedditPost[]> {
  const response = await fetch(jsonUrl, {
    headers: {
      "User-Agent": "ARCReport-Bot/1.0 (+https://arcreport.ai)",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts: RedditPost[] = [];

  for (const child of data?.data?.children ?? []) {
    const post = child.data;
    if (!post || post.stickied) continue;

    posts.push({
      title: post.title,
      url: post.url,
      selftext: post.selftext || "",
      author: post.author,
      score: post.score,
      created_utc: post.created_utc,
      num_comments: post.num_comments,
      permalink: `https://www.reddit.com${post.permalink}`,
      subreddit: post.subreddit,
      thumbnail: post.thumbnail !== "self" && post.thumbnail !== "default" ? post.thumbnail : "",
    });
  }

  return posts;
}

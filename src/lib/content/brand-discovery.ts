/**
 * Enhanced brand discovery — extracts known AND unknown brand mentions from article text.
 * Builds on extractBrandMentions() in relevance.ts with heuristic detection.
 */

import { db, schema } from "@/lib/db/index";
import { eq, and, or, sql } from "drizzle-orm";
import {
  insertDiscovery,
  getExistingDiscoveryByName,
  incrementDiscoveryMentionCount,
} from "@/lib/db/admin-queries";

// Commerce-adjacent keywords that signal a brand mention nearby
const COMMERCE_CONTEXT_PATTERNS = [
  /\b(?:shop|store|retailer|brand|merchant|marketplace|platform|checkout|cart|buy|purchase|seller|vendor|e-?commerce|dtc|direct.to.consumer)\b/i,
];

// Patterns that should NOT be treated as brand names
const BRAND_BLACKLIST = new Set([
  "the", "a", "an", "it", "they", "we", "he", "she", "this", "that",
  "here", "there", "where", "when", "what", "which", "while", "with",
  "also", "just", "like", "more", "most", "much", "very", "some", "many",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
  "new york", "san francisco", "los angeles", "london", "paris", "berlin", "tokyo",
  "ceo", "cto", "cfo", "coo", "vp", "svp", "founder", "cofounder",
  "ai", "ml", "api", "llm", "rag", "mcp", "saas", "b2b", "b2c",
  // Tech companies / platforms (not retail brands to score)
  "google", "microsoft", "meta", "openai", "anthropic", "apple",
  "amazon", "aws", "azure", "gcp", "nvidia", "intel", "ibm",
  "stripe", "shopify", "bigcommerce", "woocommerce", "squarespace", "wix",
  "langchain", "perplexity", "klarna", "paypal", "adyen", "affirm", "afterpay",
  // Media / publishers (not brands to score)
  "reuters", "bloomberg", "forbes", "techcrunch", "the verge", "wired",
  "mashable", "cnet", "ars technica", "venturebeat", "mit", "harvard",
  "podcast", "newsletter", "blog", "article", "post", "episode",
  "read more", "learn more", "click here", "sign up", "subscribe",
  "series a", "series b", "series c", "ipo",
  "united states", "european union", "china", "india",
  // Common heuristic false positives
  "practical ecommerce", "digital commerce", "modern retail",
  "product hunt", "indie hackers", "hacker news",
]);

// Domain TLDs to detect inline URL/domain mentions
const DOMAIN_PATTERN = /\b([a-z0-9][-a-z0-9]*\.(?:com|co|io|ai|shop|store|xyz|app|dev|org|net))\b/gi;

// Capitalized proper nouns (2+ capitalized words or single capitalized word ≥4 chars)
const PROPER_NOUN_PATTERN = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;

interface DiscoveredBrand {
  name: string;
  url?: string;
  reason: string;
  discoverySource: string;
}

/**
 * Extract potential unknown brand names from article text using heuristics.
 * Returns brand candidates NOT already in the known brands list.
 */
export function extractUnknownBrands(
  text: string,
  knownBrandNames: Set<string>
): DiscoveredBrand[] {
  const candidates: DiscoveredBrand[] = [];
  const seen = new Set<string>();

  // Check if the article has commerce context
  const hasCommerceContext = COMMERCE_CONTEXT_PATTERNS.some((p) => p.test(text));
  if (!hasCommerceContext) return [];

  // Strategy 1: Domain names mentioned in article text
  const domainMatches = text.matchAll(DOMAIN_PATTERN);
  for (const match of domainMatches) {
    const domain = match[1].toLowerCase();
    const brandName = domain.split(".")[0];
    if (
      brandName.length >= 3 &&
      !BRAND_BLACKLIST.has(brandName) &&
      !knownBrandNames.has(brandName) &&
      !seen.has(brandName)
    ) {
      seen.add(brandName);
      candidates.push({
        name: brandName.charAt(0).toUpperCase() + brandName.slice(1),
        url: `https://${domain}`,
        reason: `Domain mentioned in article: ${domain}`,
        discoverySource: "news_mention",
      });
    }
  }

  // Strategy 2: Capitalized proper nouns near commerce keywords
  // Split text into sentences, check each for commerce context + proper nouns
  const sentences = text.split(/[.!?]\s+/);
  for (const sentence of sentences) {
    const sentenceHasCommerce = COMMERCE_CONTEXT_PATTERNS.some((p) =>
      p.test(sentence)
    );
    if (!sentenceHasCommerce) continue;

    const nounMatches = sentence.matchAll(PROPER_NOUN_PATTERN);
    for (const match of nounMatches) {
      const name = match[1].trim();
      const nameLower = name.toLowerCase();

      if (
        name.length >= 4 &&
        !BRAND_BLACKLIST.has(nameLower) &&
        !knownBrandNames.has(nameLower) &&
        !seen.has(nameLower) &&
        // Avoid common sentence starters
        match.index !== 0
      ) {
        seen.add(nameLower);
        candidates.push({
          name,
          reason: `Proper noun near commerce keywords: "${sentence.slice(0, 80)}..."`,
          discoverySource: "news_mention",
        });
      }
    }
  }

  return candidates;
}

/**
 * Process an article and insert brand discoveries into the database.
 * Handles deduplication against both brands table and existing discoveries.
 */
export function processArticleForDiscoveries(
  articleId: number,
  articleText: string,
  mentionedBrands: string[]
) {
  // Build dedup sets
  const existingBrands = db
    .select({ name: schema.brands.name })
    .from(schema.brands)
    .all();
  const existingBrandNames = new Set(
    existingBrands.map((b) => b.name.toLowerCase())
  );

  const results = { newDiscoveries: 0, updatedMentions: 0 };

  // Process known brand mentions from relevance scoring
  for (const brandName of mentionedBrands) {
    if (existingBrandNames.has(brandName.toLowerCase())) continue;

    const existing = getExistingDiscoveryByName(brandName);
    if (existing) {
      incrementDiscoveryMentionCount(existing.id);
      results.updatedMentions++;
    } else {
      insertDiscovery({
        name: brandName,
        discoverySource: "news_mention",
        sourceArticleId: articleId,
        reason: `Mentioned in scanned article`,
      });
      results.newDiscoveries++;
    }
  }

  // Process heuristic unknown brand candidates
  const unknowns = extractUnknownBrands(articleText, existingBrandNames);
  for (const candidate of unknowns) {
    const existing = getExistingDiscoveryByName(candidate.name);
    if (existing) {
      incrementDiscoveryMentionCount(existing.id);
      results.updatedMentions++;
    } else {
      insertDiscovery({
        name: candidate.name,
        url: candidate.url,
        discoverySource: candidate.discoverySource,
        sourceArticleId: articleId,
        reason: candidate.reason,
      });
      results.newDiscoveries++;
    }
  }

  return results;
}

/**
 * Run brand discovery across recent articles (for cron job).
 * Looks at articles from the last N hours.
 */
export function runBrandDiscovery(hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  const articles = db
    .select()
    .from(schema.newsArticles)
    .where(sql`${schema.newsArticles.createdAt} >= ${since}`)
    .all();

  let totalNew = 0;
  let totalUpdated = 0;

  for (const article of articles) {
    const fullText = [article.title, article.description].filter(Boolean).join(" ");
    const mentionedBrands: string[] = JSON.parse(article.mentionedBrands || "[]");

    const result = processArticleForDiscoveries(article.id, fullText, mentionedBrands);
    totalNew += result.newDiscoveries;
    totalUpdated += result.updatedMentions;
  }

  return {
    articlesProcessed: articles.length,
    newDiscoveries: totalNew,
    updatedMentions: totalUpdated,
  };
}

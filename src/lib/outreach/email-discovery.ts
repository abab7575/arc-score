/**
 * Email Discovery via Apollo.io API
 *
 * Searches for e-commerce decision-makers at a given domain
 * and returns their contact details.
 *
 * Free tier: 100 credits/month (1 credit per email reveal)
 */

const APOLLO_BASE = "https://api.apollo.io/api/v1";

const TARGET_TITLES = [
  "Head of E-commerce",
  "Head of Ecommerce",
  "VP E-commerce",
  "VP Ecommerce",
  "VP Digital",
  "Head of Digital",
  "Director of E-commerce",
  "Director of Ecommerce",
  "Director of Digital",
  "Head of Growth",
  "Chief Marketing Officer",
  "CMO",
  "CTO",
  "Chief Technology Officer",
  "Head of Product",
  "VP Marketing",
  "Director of Marketing",
];

interface ApolloContact {
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  linkedinUrl: string | null;
  confidence: string; // "verified", "guessed", etc.
}

interface DiscoveryResult {
  found: boolean;
  contact: ApolloContact | null;
  source: "apollo";
  creditsUsed: number;
  error?: string;
}

/**
 * Search Apollo for e-commerce decision-makers at a domain.
 * Returns the best match (highest seniority with a verified email).
 */
export async function findContactAtDomain(domain: string): Promise<DiscoveryResult> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return { found: false, contact: null, source: "apollo", creditsUsed: 0, error: "APOLLO_API_KEY not set" };
  }

  // Clean the domain
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  try {
    // Step 1: Search for people at this domain with e-commerce titles
    const searchRes = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        q_organization_domains_list: [cleanDomain],
        person_titles: TARGET_TITLES,
        person_seniorities: ["vp", "director", "c_suite", "owner", "founder"],
        page: 1,
        per_page: 5,
      }),
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error(`[Apollo] Search failed (${searchRes.status}):`, errText);
      return { found: false, contact: null, source: "apollo", creditsUsed: 0, error: `API error: ${searchRes.status}` };
    }

    const searchData = await searchRes.json();
    const people = searchData.people ?? [];

    if (people.length === 0) {
      // Try broader search without title filter
      const broadRes = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          q_organization_domains_list: [cleanDomain],
          person_seniorities: ["vp", "director", "c_suite"],
          page: 1,
          per_page: 3,
        }),
      });

      if (broadRes.ok) {
        const broadData = await broadRes.json();
        if (broadData.people?.length > 0) {
          people.push(...broadData.people);
        }
      }
    }

    if (people.length === 0) {
      return { found: false, contact: null, source: "apollo", creditsUsed: 0, error: "No contacts found at this domain" };
    }

    // Pick the best candidate: prefer verified email, then highest seniority
    const ranked = people
      .filter((p: Record<string, unknown>) => p.email || p.id)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        // Prefer people with emails already revealed
        if (a.email && !b.email) return -1;
        if (!a.email && b.email) return 1;
        // Then by seniority
        const seniorityOrder: Record<string, number> = { c_suite: 0, owner: 1, founder: 2, vp: 3, director: 4, manager: 5 };
        const aRank = seniorityOrder[a.seniority as string] ?? 6;
        const bRank = seniorityOrder[b.seniority as string] ?? 6;
        return aRank - bRank;
      });

    const best = ranked[0];

    // If no email on the best candidate, try to enrich (costs 1 credit)
    let email = best.email as string | null;
    let creditsUsed = 0;

    if (!email && best.id) {
      const enrichRes = await fetch(`${APOLLO_BASE}/people/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          id: best.id,
          reveal_personal_emails: false,
        }),
      });

      if (enrichRes.ok) {
        const enrichData = await enrichRes.json();
        email = enrichData.person?.email ?? null;
        creditsUsed = 1;
      }
    }

    const contact: ApolloContact = {
      email,
      firstName: best.first_name ?? "",
      lastName: best.last_name ?? "",
      name: best.name ?? `${best.first_name ?? ""} ${best.last_name ?? ""}`.trim(),
      title: best.title ?? "",
      linkedinUrl: best.linkedin_url ?? null,
      confidence: email ? (best.email_status === "verified" ? "verified" : "guessed") : "none",
    };

    return {
      found: !!email,
      contact,
      source: "apollo",
      creditsUsed,
    };
  } catch (err) {
    console.error("[Apollo] Error:", err);
    return { found: false, contact: null, source: "apollo", creditsUsed: 0, error: String(err) };
  }
}

/**
 * Batch lookup emails for multiple domains.
 * Respects rate limits (1 request/second).
 */
export async function batchFindContacts(
  domains: { brandId: number; domain: string }[],
  maxCredits = 20
): Promise<Map<number, DiscoveryResult>> {
  const results = new Map<number, DiscoveryResult>();
  let creditsUsed = 0;

  for (const { brandId, domain } of domains) {
    if (creditsUsed >= maxCredits) {
      console.log(`[Apollo] Credit limit reached (${creditsUsed}/${maxCredits}). Stopping.`);
      break;
    }

    const result = await findContactAtDomain(domain);
    results.set(brandId, result);
    creditsUsed += result.creditsUsed;

    // Rate limit: wait 1 second between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[Apollo] Batch complete: ${results.size} lookups, ${creditsUsed} credits used`);
  return results;
}

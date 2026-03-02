/**
 * Twitter/X accounts to watch — manual curation list.
 * These are shown in the admin panel with links to their profiles.
 */

export interface TwitterAccount {
  handle: string;
  name: string;
  category: string;
}

export const TWITTER_ACCOUNTS: TwitterAccount[] = [
  { handle: "scotwingo", name: "Scot Wingo", category: "ecommerce" },
  { handle: "retailgeek", name: "Retail Geek", category: "retail" },
  { handle: "gregisenberg", name: "Greg Isenberg", category: "startups" },
  { handle: "cloydschneider", name: "Cloyd Schneider", category: "ecommerce" },
  { handle: "AravSrinivas", name: "Aravind Srinivas", category: "ai" },
  { handle: "sama", name: "Sam Altman", category: "ai" },
  { handle: "patrickc", name: "Patrick Collison", category: "payments" },
  { handle: "tobi", name: "Tobi Lutke", category: "ecommerce" },
  { handle: "fourweekmba", name: "FourWeekMBA", category: "analysis" },
  { handle: "markbrohan", name: "Mark Brohan", category: "ecommerce" },
  { handle: "dharmesh", name: "Dharmesh Shah", category: "ai" },
  { handle: "emollick", name: "Ethan Mollick", category: "ai" },
  { handle: "hwchase17", name: "Harrison Chase", category: "ai-agents" },
  { handle: "mattshumer_", name: "Matt Shumer", category: "ai-agents" },
];

export function getTwitterProfileUrl(handle: string): string {
  return `https://x.com/${handle}`;
}

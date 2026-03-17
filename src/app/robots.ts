import type { MetadataRoute } from "next";

const BASE_URL = process.env.BASE_URL || "https://arcreport.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      // We welcome AI agents — we practice what we preach
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/cron", "/checkout", "/account"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

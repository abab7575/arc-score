import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3", "@resvg/resvg-js", "@google/genai"],
  async rewrites() {
    // Markdown variants of key data pages (B3): /matrix.md, /brand/nike.md, …
    return [
      { source: "/brand/:slug.md", destination: "/api/md/brand/:slug" },
      { source: "/:page.md", destination: "/api/md/:page" },
    ];
  },
  async redirects() {
    return [
      { source: "/agents", destination: "/", permanent: true },
      { source: "/submit", destination: "/", permanent: true },
      { source: "/instant-check", destination: "/", permanent: true },
      { source: "/report", destination: "/", permanent: true },
      { source: "/report/:path*", destination: "/", permanent: true },
      { source: "/pricing", destination: "/#agency-system", permanent: true },
      { source: "/pro", destination: "/#agency-system", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com https://api.stripe.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

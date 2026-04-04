import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@resvg/resvg-js", "@google/genai"],
  async redirects() {
    return [
      { source: "/compare", destination: "/matrix", permanent: true },
      { source: "/compare/:path*", destination: "/matrix", permanent: true },
      { source: "/agents", destination: "/", permanent: true },
      { source: "/submit", destination: "/", permanent: true },
      { source: "/instant-check", destination: "/", permanent: true },
      { source: "/report", destination: "/", permanent: true },
      { source: "/report/:path*", destination: "/", permanent: true },
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
        ],
      },
    ];
  },
};

export default nextConfig;

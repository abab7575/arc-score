import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_URL, BRAND_COUNT_DISPLAY } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "ARC Report — AI Commerce Monitoring for Ecommerce Agencies";
const SITE_DESCRIPTION = `Help ecommerce agencies lead clients into agentic commerce: monitor stores, uncover AI-commerce issues, generate co-branded reports, and query portfolio intelligence through MCP. Powered by ${BRAND_COUNT_DISPLAY} daily store scans.`;
const OG_IMAGE = `${SITE_URL}/api/og?title=Lead+Clients+into+Agentic+Commerce&subtitle=Portfolio+monitoring%2C+evidence%2C+and+implementation+guidance+for+agencies`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": [
        { url: "/changelog.xml", title: "ARC Report — Agent Access Changelog" },
        { url: "/weekly.xml", title: "ARC Report — Weekly Agent Access Digest" },
      ],
    },
  },
  applicationName: "ARC Report",
  robots: "index, follow",
  keywords: [
    "AI agents",
    "e-commerce",
    "robots.txt",
    "agent access",
    "structured data",
    "ARC Report",
    "commerce intelligence",
    "AI readiness",
    "open data",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "ARC Report",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ARC Report — AI Commerce Monitoring for Ecommerce Agencies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

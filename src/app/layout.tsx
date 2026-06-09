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

const SITE_TITLE = "ARC Report — The Open Dataset of AI Agent Access in E-Commerce";
const SITE_DESCRIPTION = `The public reference dataset for how commerce sites treat AI agents. ${BRAND_COUNT_DISPLAY} e-commerce brands scanned daily: robots.txt policies, live agent HTTP tests, structured data, platform detection, llms.txt. Free, open data (CC BY 4.0).`;
const OG_IMAGE = `${SITE_URL}/api/og?title=AI+Agent+Access+in+E-Commerce&subtitle=The+open+reference+dataset+%E2%80%94+scanned+daily`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
        alt: "ARC Report — AI Agent Access in E-Commerce",
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

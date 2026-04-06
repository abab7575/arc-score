import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARC Report — Agent Access Intelligence for E-Commerce",
  description:
    "Public intelligence layer for how commerce sites are preparing for AI agents. Daily-scanned agent access signals for 1,000+ e-commerce brands: robots.txt policies, platform detection, structured data, and policy changes.",
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
  ],
  openGraph: {
    type: "website",
    url: "https://arcreport.ai",
    title: "ARC Report — Agent Access Intelligence for E-Commerce",
    description:
      "Public intelligence layer for how commerce sites are preparing for AI agents. Daily-scanned agent access signals for 1,000+ e-commerce brands: robots.txt policies, platform detection, structured data, and policy changes.",
    siteName: "ARC Report",
    images: [
      {
        url: "https://arcreport.ai/api/og?title=AI+Agent+Intelligence+for+E-Commerce&subtitle=1%2C000%2B+brands+scanned+daily&stat=1%2C006",
        width: 1200,
        height: 630,
        alt: "ARC Report — AI Agent Intelligence for E-Commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARC Report — Agent Access Intelligence for E-Commerce",
    description:
      "Public intelligence layer for how commerce sites are preparing for AI agents. Daily-scanned agent access signals for 1,000+ e-commerce brands.",
    images: [
      "https://arcreport.ai/api/og?title=AI+Agent+Intelligence+for+E-Commerce&subtitle=1%2C000%2B+brands+scanned+daily&stat=1%2C006",
    ],
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

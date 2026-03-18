import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agent Access Matrix — 276 Brands | ARC Report",
  description:
    "Which AI shopping agents can access the top e-commerce brands? Real-time robots.txt analysis across 276 brands. Free, open data from ARC Report.",
};

export default function MatrixLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

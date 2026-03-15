import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Brands — Robot Shopper",
  description:
    "Compare AI agent readiness scores side-by-side. See how e-commerce brands stack up across ACP support, checkout APIs, structured data, and more.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

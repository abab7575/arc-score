import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Robot Shopper",
  description:
    "AI agent readiness monitoring for e-commerce. Free scores for every brand. Full diagnostics from $99/mo.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

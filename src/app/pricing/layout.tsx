import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — ARC Report",
  description:
    "Agent access intelligence for e-commerce. Free index, always. Pro at $100/mo adds 90+ days history, full changelog, CSV/JSON exports, API access, and email alerts.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

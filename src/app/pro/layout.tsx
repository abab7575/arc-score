import type { Metadata } from "next";
import { PRO_PRICE_MONTHLY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pro — ARC Report",
  description: `Agent access intelligence for e-commerce. Free index, always. Pro at $${PRO_PRICE_MONTHLY}/mo adds 90+ days history, full changelog, CSV/JSON exports, API access, and email alerts.`,
};

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

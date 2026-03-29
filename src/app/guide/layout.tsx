import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Guide to Agentic Commerce | ARC Report",
  description:
    "How AI shopping agents interact with e-commerce sites. Original data from scanning 1,000+ brands.",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

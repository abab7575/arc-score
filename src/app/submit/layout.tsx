import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Your Site — ARC Report",
  description:
    "Submit your e-commerce site for a free AI agent readiness scan. Get your score, category breakdown, and grade within 24 hours.",
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — Robot Shopper",
  description:
    "Log in to your Robot Shopper account to access reports, monitoring dashboards, and agent journey replays.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

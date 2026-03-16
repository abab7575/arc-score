import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — ARC Report",
  description:
    "Log in to your ARC Report account to access reports, monitoring dashboards, and agent journey replays.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

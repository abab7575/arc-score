import { redirect } from "next/navigation";

export const metadata = {
  title: "About — ARC Score",
  description: "Learn how ARC Score measures agent readiness for e-commerce sites.",
};

export default function AboutPage() {
  redirect("/methodology");
}

import { redirect } from "next/navigation";

export const metadata = {
  title: "About — ARC Report",
  description: "Learn how ARC Report measures agent readiness for e-commerce sites.",
};

export default function AboutPage() {
  redirect("/methodology");
}

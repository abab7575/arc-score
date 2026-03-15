import { redirect } from "next/navigation";

export const metadata = {
  title: "About — Robot Shopper",
  description: "Learn how Robot Shopper measures agent readiness for e-commerce sites.",
};

export default function AboutPage() {
  redirect("/methodology");
}

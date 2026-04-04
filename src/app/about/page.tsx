import { redirect } from "next/navigation";

export const metadata = {
  title: "About — ARC Report",
  description: "Public intelligence layer for how e-commerce sites are preparing for AI agents.",
};

export default function AboutPage() {
  redirect("/docs");
}

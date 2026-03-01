import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { LandscapeContent } from "@/components/landscape/landscape-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Agentic Commerce Landscape — ARC Score",
  description:
    "An interactive guide to the AI shopping revolution. Explore how AI agents discover, compare, and buy products — and what it means for your e-commerce site.",
};

export default function LandscapePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LandscapeContent />
      <Footer />
    </div>
  );
}

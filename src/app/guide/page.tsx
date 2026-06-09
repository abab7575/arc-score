import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { GuideContent } from "@/components/guide/guide-content";

export default function GuidePage() {
  return (
    <>
      <Navbar />
      <GuideContent />
      <Footer />
    </>
  );
}

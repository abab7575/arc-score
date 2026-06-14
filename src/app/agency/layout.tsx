import { Navbar } from "@/components/shared/navbar";

export const metadata = { title: "Arc for Agencies", robots: "noindex, nofollow" };

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}

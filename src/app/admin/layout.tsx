import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata = {
  title: "Mission Control — Robot Shopper",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#FFF8F0", minHeight: "100vh" }}>
      <Navbar />
      <AdminSidebar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}

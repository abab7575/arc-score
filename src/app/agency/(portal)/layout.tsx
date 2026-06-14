import { redirect } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { AgencyNav } from "@/components/agency/agency-nav";
import { getAgencySession } from "@/lib/agency/core";

export default async function AgencyPortalLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAgencySession();
  if (!auth) redirect("/agency/login");
  return (
    <>
      <AgencyNav name={auth.workspace.name} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">{children}</main>
      <Footer />
    </>
  );
}

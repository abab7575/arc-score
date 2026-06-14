import { notFound } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { SiteReport } from "@/components/agency/site-report";
import { getPreviewByToken } from "@/lib/agency/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private agency preview — ARC Report", robots: "noindex, nofollow" };

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = getPreviewByToken(token, true);
  if (!data) notFound();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="border-l-8 px-6 py-3 bg-white" style={{ borderColor: data.workspace.primaryColor }}>
          <div className="spec-label text-muted-foreground">PRIVATE PORTFOLIO PREVIEW</div>
          <h1 className="text-3xl font-black mt-2">Prepared for {data.workspace.name}</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            ARC independently scanned public storefronts associated with your portfolio. Findings are based on current public evidence and do not imply endorsement.
          </p>
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {data.sites.map((item) => <SiteReport key={item.site.id} item={item} />)}
        </div>
        <section className="mt-8 bg-[#0A1628] text-white p-7">
          <div className="spec-label text-[#84AFFB]">ARC FOR AGENCIES</div>
          <h2 className="text-2xl font-black mt-2">Monitor up to 50 client stores.</h2>
          <p className="mt-2 text-white/70">Daily readiness checks, regression alerts, co-branded reports, and implementation-ready fixes for $149/month.</p>
          <form action="/api/agency/auth/request" method="post" className="mt-5 flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="workspaceId" value={data.workspace.id} />
            <input type="hidden" name="previewToken" value={token} />
            <input required type="email" name="email" placeholder={`you@${data.workspace.domain}`} className="bg-white text-[#0A1628] px-4 py-3 flex-1" />
            <button className="bg-[#FF6648] px-5 py-3 font-black">Claim this workspace</button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

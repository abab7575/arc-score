import { getAgencySession, getWorkspaceReadout } from "@/lib/agency/core";
import { SiteReport } from "@/components/agency/site-report";

export const dynamic = "force-dynamic";

export default async function AgencyReportsPage() {
  const auth = await getAgencySession();
  const data = auth ? getWorkspaceReadout(auth.workspace.id) : null;
  if (!data) return null;
  return (
    <div>
      <div className="print:hidden">
        <div className="spec-label text-[#0259DD]">CO-BRANDED PORTFOLIO REPORT</div>
        <h1 className="text-3xl font-black mt-1">{data.workspace.name}</h1>
        <p className="text-muted-foreground mt-2">Use your browser’s Print command to export this report as PDF.</p>
      </div>
      <div className="mt-7 space-y-5">
        {data.sites.map((item) => <SiteReport key={item.site.id} item={item} />)}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getAgencySession, getWorkspaceReadout, workspaceHasPaidAccess } from "@/lib/agency/core";
import { SiteReport } from "@/components/agency/site-report";

export const dynamic = "force-dynamic";

export default async function AgencyDashboard() {
  const auth = await getAgencySession();
  const data = auth ? getWorkspaceReadout(auth.workspace.id) : null;
  if (!auth || !data) return null;
  const paid = workspaceHasPaidAccess(auth.workspace);
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="spec-label text-[#0259DD]">PORTFOLIO CONTROL ROOM</div>
          <h1 className="text-3xl font-black mt-1">{auth.workspace.name}</h1>
          <p className="text-muted-foreground mt-1">{data.sites.length} of 50 sites monitored.</p>
        </div>
        {!paid && (
          <form action="/api/agency/billing/checkout" method="post">
            <button className="bg-[#FF6648] text-white font-black px-5 py-3">Start 14-day trial</button>
          </form>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
        {[
          ["Average score", data.averageScore ?? "—"],
          ["Open issues", data.issueCount],
          ["Stale scans", data.staleCount],
          ["Plan", paid ? auth.workspace.status : "Preview"],
        ].map(([label, value]) => (
          <div key={label} className="border bg-white p-4">
            <div className="text-2xl font-black capitalize">{value}</div>
            <div className="spec-label text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-black">Highest-priority opportunities</h2>
        <Link href="/agency/sites" className="text-sm text-[#0259DD]">Manage portfolio →</Link>
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-5">
        {[...data.sites].sort((a, b) => b.issues.length - a.issues.length).slice(0, 4)
          .map((item) => <SiteReport key={item.site.id} item={item} compact />)}
      </div>
    </>
  );
}

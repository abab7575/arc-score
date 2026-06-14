import { getAgencySession, getWorkspaceReadout, workspaceHasPaidAccess } from "@/lib/agency/core";
import { SiteReport } from "@/components/agency/site-report";

export const dynamic = "force-dynamic";

export default async function AgencySitesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [auth, query] = await Promise.all([getAgencySession(), searchParams]);
  const data = auth ? getWorkspaceReadout(auth.workspace.id) : null;
  if (!auth || !data) return null;
  return (
    <>
      <h1 className="text-3xl font-black">Portfolio sites</h1>
      <p className="text-muted-foreground mt-2">Add client or prospect storefronts. Arc monitors up to 50 active sites.</p>
      {query.error && <p className="mt-4 text-sm text-red-700">{query.error}</p>}
      <form action="/api/agency/sites" method="post" className="mt-6 border-2 bg-white p-4 flex flex-col sm:flex-row gap-3">
        <label htmlFor="site-domain" className="sr-only">Store domain</label>
        <input id="site-domain" required name="domain" inputMode="url" placeholder="store.example.com" className="border px-4 py-3 flex-1" />
        <label htmlFor="site-relationship" className="sr-only">Relationship</label>
        <select id="site-relationship" name="relationship" className="border px-4 py-3">
          <option value="client">Client</option>
          <option value="prospect">Prospect</option>
        </select>
        <button className="bg-[#0259DD] text-white font-black px-5 py-3">Add and scan</button>
      </form>
      <div className="mt-6 grid md:grid-cols-2 gap-5">
        {data.sites.map((item) => (
          <div key={item.site.id}>
            <SiteReport item={item} compact />
            {workspaceHasPaidAccess(auth.workspace) && (
              <form action="/api/agency/deep-scan" method="post" className="border-x-2 border-b-2 bg-white px-5 pb-5">
                <input type="hidden" name="siteId" value={item.site.id} />
                <button className="text-xs font-bold text-[#0259DD]">Run full browser journey</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

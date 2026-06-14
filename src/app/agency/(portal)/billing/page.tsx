import { getAgencySession, workspaceHasPaidAccess } from "@/lib/agency/core";
import { billingEnvironmentReady } from "@/lib/agency/stripe";

export default async function AgencyBillingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const auth = await getAgencySession();
  if (!auth) return null;
  const query = await searchParams;
  const paid = workspaceHasPaidAccess(auth.workspace);
  const billingReady = billingEnvironmentReady();
  return (
    <>
      <h1 className="text-3xl font-black">Billing</h1>
      <div className="mt-6 border-2 bg-white p-6">
        <div className="text-2xl font-black">$149/month</div>
        <p className="mt-2 text-muted-foreground">Up to 50 monitored sites, daily checks, weekly digest, reports, fixes, and private MCP access.</p>
        <p className="mt-4 text-sm">Current status: <strong className="capitalize">{auth.workspace.status}</strong></p>
        {query.error && <p className="mt-4 text-sm text-red-700">{query.error}</p>}
        {billingReady ? (
          <form action={paid ? "/api/agency/billing/portal" : "/api/agency/billing/checkout"} method="post" className="mt-5">
            <button className="bg-[#FF6648] text-white font-black px-5 py-3">{paid ? "Manage billing" : "Start 14-day trial"}</button>
          </form>
        ) : (
          <p className="mt-5 border border-amber-300 bg-amber-50 p-3 text-sm">
            Billing is temporarily unavailable. Your workspace remains accessible while payment setup is completed.
          </p>
        )}
      </div>
    </>
  );
}

import Link from "next/link";

export function AgencyNav({ name }: { name: string }) {
  return (
    <div className="bg-[#0A1628] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-5">
        <Link href="/agency" className="font-black">{name}</Link>
        <Link href="/agency/sites" className="text-sm text-white/70 hover:text-white">Sites</Link>
        <Link href="/agency/reports" className="text-sm text-white/70 hover:text-white">Reports</Link>
        <Link href="/agency/settings" className="text-sm text-white/70 hover:text-white">Settings & MCP</Link>
        <Link href="/agency/billing" className="text-sm text-white/70 hover:text-white">Billing</Link>
        <form action="/api/agency/logout" method="post" className="ml-auto">
          <button className="text-xs text-white/60 hover:text-white">Sign out</button>
        </form>
      </div>
    </div>
  );
}

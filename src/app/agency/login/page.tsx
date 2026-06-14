import { Footer } from "@/components/shared/footer";

export const metadata = { title: "Agency login — ARC Report", robots: "noindex, nofollow" };

export default function AgencyLoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  return searchParams.then((query) => (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-4 py-20">
        <div className="border-2 bg-white p-7">
          <div className="spec-label text-[#0259DD]">ARC FOR AGENCIES</div>
          <h1 className="text-3xl font-black mt-2">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your agency work email to create or access your workspace. No password required.</p>
          {query.sent && <p className="mt-4 text-sm text-emerald-700">Check your inbox for the sign-in link.</p>}
          {query.error && <p className="mt-4 text-sm text-red-700">{query.error}</p>}
          <form action="/api/agency/auth/request" method="post" className="mt-6 space-y-3">
            <label htmlFor="agency-email" className="sr-only">Agency work email</label>
            <input id="agency-email" required name="email" type="email" autoComplete="email" placeholder="you@agency.com" className="w-full border px-4 py-3" />
            <button className="w-full bg-[#0259DD] text-white px-4 py-3 font-black">Email sign-in link</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  ));
}

import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export default function NotFound() {
  return (
    <div style={{ backgroundColor: "#0A1628" }} className="min-h-screen flex flex-col text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-6 py-24">
          <h1
            className="font-mono text-[10rem] leading-none font-bold tracking-tighter"
            style={{ color: "#FF6648" }}
          >
            404
          </h1>

          <p
            className="font-mono text-sm tracking-[0.35em] uppercase mt-6"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Page Not Found
          </p>

          <p
            className="mt-4 text-lg"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            The signal was lost somewhere between here and there.
          </p>

          <Link
            href="/"
            className="inline-block mt-10 px-8 py-3 rounded-full font-mono text-sm uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: "#FF6648",
              color: "#0A1628",
            }}
          >
            Return to Base
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

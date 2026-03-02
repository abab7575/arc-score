import Link from "next/link";
import { Lock } from "lucide-react";

interface PaywallGateProps {
  title: string;
  description: string;
  itemCount?: number;
}

export function PaywallGate({ title, description, itemCount }: PaywallGateProps) {
  return (
    <section className="py-12">
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <div className="relative mt-4">
        {/* Blurred preview hint */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#0259DD]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-[#0259DD]" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {itemCount ? `${itemCount} ${title.toLowerCase()} available` : `${title} available`}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {description}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0259DD] text-white text-sm font-semibold hover:bg-[#0259DD]/90 transition-colors"
            >
              Unlock Full Report — $79/mo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

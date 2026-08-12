import type { Metadata } from "next";
import Link from "next/link";
import { BrandGuidelinesContent } from "@/components/BrandGuidelinesContent";

export const metadata: Metadata = {
  title: "Brand Guidelines · Pollo Campero",
  description:
    "Fixed brand guidelines for Pollo Campero marketing promo briefs — product naming, logo, drinks, and more.",
};

export default function BrandGuidelinesPublicPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-stone-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-campero-orange">
            Pollo Campero · Marketing
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Brand Guidelines
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <BrandGuidelinesContent />
      </main>

      <footer className="border-t border-stone-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 text-xs text-stone-400 flex flex-wrap items-center justify-between gap-2">
          <span>Campero Promo Brief Builder</span>
          <Link
            href="/"
            className="font-semibold text-campero-orange hover:underline"
          >
            Open brief builder
          </Link>
        </div>
      </footer>
    </div>
  );
}

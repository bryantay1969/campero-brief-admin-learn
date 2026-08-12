"use client";

import { BrandGuidelinesContent } from "@/components/BrandGuidelinesContent";
import { useBriefStore } from "@/store/briefStore";
import { X } from "lucide-react";

export function BrandGuidelinesPanel() {
  const show = useBriefStore((s) => s.showGuidelines);
  const setShow = useBriefStore((s) => s.setShowGuidelines);

  // Floating bottom-right trigger removed — open from the left toolbar only.
  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
        onClick={() => setShow(false)}
        aria-hidden
      />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-campero-orange">
              Fixed reference
            </p>
            <h2 className="text-lg font-bold text-stone-900">
              Brand Guidelines
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-stone-800"
            aria-label="Close guidelines"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <BrandGuidelinesContent compact />
        </div>
      </aside>
    </>
  );
}

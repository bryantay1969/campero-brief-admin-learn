"use client";

import { BRAND_GUIDELINES } from "@/lib/brandGuidelines";
import { useBriefStore } from "@/store/briefStore";
import { BookOpen, X } from "lucide-react";

function GuideBlock({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-campero-orange mb-1.5">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="text-xs text-stone-600 leading-relaxed pl-3 border-l-2 border-orange-100"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BrandGuidelinesPanel() {
  const show = useBriefStore((s) => s.showGuidelines);
  const setShow = useBriefStore((s) => s.setShowGuidelines);

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-stone-800 transition-colors"
      >
        <BookOpen className="h-4 w-4 text-campero-yellow" />
        Brand Guidelines
      </button>
    );
  }

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
          <p className="text-xs text-stone-500 mb-4 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
            Not editable per brief. Apply these rules across all creative and
            copy for this promo.
          </p>
          <GuideBlock
            title="Product naming"
            items={BRAND_GUIDELINES.productNaming}
          />
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-campero-orange mb-1.5">
              Never include
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {BRAND_GUIDELINES.neverInclude.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <GuideBlock title="Drink rules" items={BRAND_GUIDELINES.drinkRules} />
          <GuideBlock title="Logo rules" items={BRAND_GUIDELINES.logoRules} />
          <GuideBlock
            title="Piece formatting"
            items={BRAND_GUIDELINES.pieceFormatting}
          />
          <GuideBlock
            title="Date formatting"
            items={BRAND_GUIDELINES.dateFormatting}
          />
          <GuideBlock
            title="“&” vs “and”"
            items={BRAND_GUIDELINES.andVsAmpersand}
          />
          <GuideBlock
            title="Protein messaging"
            items={BRAND_GUIDELINES.proteinMessaging}
          />
          <GuideBlock
            title="Website formatting"
            items={BRAND_GUIDELINES.websiteFormatting}
          />
          <GuideBlock
            title="Social icon order"
            items={BRAND_GUIDELINES.socialIconOrder}
          />
        </div>
      </aside>
    </>
  );
}

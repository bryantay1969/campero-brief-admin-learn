import { BRAND_GUIDELINES } from "@/lib/brandGuidelines";

function GuideBlock({
  title,
  items,
  compact,
}: {
  title: string;
  items: readonly string[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-4" : "mb-5"}>
      <h2 className="text-xs font-bold uppercase tracking-wider text-campero-orange mb-1.5">
        {title}
      </h2>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={
              compact
                ? "text-xs text-stone-600 leading-relaxed pl-3 border-l-2 border-orange-100"
                : "text-sm text-stone-600 leading-relaxed pl-3 border-l-2 border-orange-100"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shared brand guidelines body — panel + public page. */
export function BrandGuidelinesContent({ compact }: { compact?: boolean }) {
  return (
    <div>
      {/* Intro only in the in-app panel, not the public page */}
      {compact && (
        <p className="text-xs text-stone-500 mb-4 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
          Not editable per brief. Apply these rules across all creative and copy
          for this promo.
        </p>
      )}

      <GuideBlock
        compact={compact}
        title="Product naming"
        items={BRAND_GUIDELINES.productNaming}
      />

      <div className={compact ? "mb-4" : "mb-5"}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-campero-orange mb-1.5">
          Never include
        </h2>
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

      <GuideBlock
        compact={compact}
        title="Drink rules"
        items={BRAND_GUIDELINES.drinkRules}
      />
      <GuideBlock
        compact={compact}
        title="Logo rules"
        items={BRAND_GUIDELINES.logoRules}
      />
      <GuideBlock
        compact={compact}
        title="Piece formatting"
        items={BRAND_GUIDELINES.pieceFormatting}
      />
      <GuideBlock
        compact={compact}
        title="Date formatting"
        items={BRAND_GUIDELINES.dateFormatting}
      />
      <GuideBlock
        compact={compact}
        title="“&” vs “and”"
        items={BRAND_GUIDELINES.andVsAmpersand}
      />
      <GuideBlock
        compact={compact}
        title="Protein messaging"
        items={BRAND_GUIDELINES.proteinMessaging}
      />
      <GuideBlock
        compact={compact}
        title="Website formatting"
        items={BRAND_GUIDELINES.websiteFormatting}
      />
      <GuideBlock
        compact={compact}
        title="Social icon order"
        items={BRAND_GUIDELINES.socialIconOrder}
      />
    </div>
  );
}

"use client";

import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextArea,
} from "@/components/ui/FormControls";
import {
  LEGAL_TEMPLATES,
  getCopyrightLine,
} from "@/lib/legalTemplates";
import type { LegalTemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEMPLATE_IDS = Object.keys(LEGAL_TEMPLATES) as Exclude<
  LegalTemplateId,
  "custom"
>[];

export function LegalSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const legal = brief.legal;

  const applyTemplate = (id: Exclude<LegalTemplateId, "custom">) => {
    patch("legal", {
      ...legal,
      templateId: id,
      legalText: LEGAL_TEMPLATES[id].text,
    });
  };

  const copyright = getCopyrightLine(
    legal.copyrightVariant,
    legal.copyrightYear
  );

  return (
    <SectionCard id="section-legal" title="Legal">
      {brief.loyaltyOnly === "yes" && (
        <div className="rounded-lg border border-campero-orange/30 bg-orange-50 px-3 py-2 text-sm text-stone-700">
          <strong className="text-campero-orange">Loyalty only:</strong>{" "}
          BOGO/Loyalty legal language is recommended. Confirm redemption
          notes match Rewards drop instructions.
        </div>
      )}

      <div>
        <FieldLabel>Quick-select legal templates</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_IDS.map((id) => {
            const t = LEGAL_TEMPLATES[id];
            const active = legal.templateId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyTemplate(id)}
                title={t.description}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-campero-orange bg-orange-50 text-stone-900 shadow-sm"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                )}
              >
                <span className="font-semibold block">{t.label}</span>
                <span className="text-xs text-stone-500">{t.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="legalText" hint="Editable — customize as needed">
          Legal block
        </FieldLabel>
        <TextArea
          id="legalText"
          value={legal.legalText}
          onChange={(e) =>
            patch("legal", {
              ...legal,
              templateId: "custom",
              legalText: e.target.value,
            })
          }
          className="min-h-[160px] font-serif text-[13px] leading-relaxed"
          rows={7}
        />
      </div>

      <div>
        <FieldLabel>Copyright line</FieldLabel>
        <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 mb-3">
          {(
            [
              { v: "digital" as const, label: "Digital" },
              { v: "print" as const, label: "Print" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() =>
                patch("legal", {
                  ...legal,
                  copyrightVariant: opt.v,
                })
              }
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                legal.copyrightVariant === opt.v
                  ? "bg-campero-orange text-white shadow-sm"
                  : "text-stone-600 hover:bg-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
          Year auto-updates to <strong>{legal.copyrightYear}</strong>.{" "}
          {copyright}
        </p>
      </div>
    </SectionCard>
  );
}

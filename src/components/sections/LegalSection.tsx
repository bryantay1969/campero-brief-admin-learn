"use client";

import { useEffect, useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextArea,
} from "@/components/ui/FormControls";
import {
  BUILTIN_LEGAL_TEMPLATES,
  getCopyrightLine,
  type LegalTemplateDef,
} from "@/lib/legalTemplates";
import { fetchLegalTemplatesForForm } from "@/lib/supabase/legalTemplatesApi";
import { cn } from "@/lib/utils";

export function LegalSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const legal = brief.legal;

  const [templates, setTemplates] = useState<LegalTemplateDef[]>(
    BUILTIN_LEGAL_TEMPLATES
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLegalTemplatesForForm()
      .then((list) => {
        if (cancelled) return;
        setTemplates(list);
        const fromCloud = list.some((t) => t.dbId);
        setSource(fromCloud ? "cloud" : "builtin");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTemplate = (t: LegalTemplateDef) => {
    patch("legal", {
      ...legal,
      templateId: t.slug,
      legalText: t.text,
    });
  };

  const copyright = getCopyrightLine(
    legal.copyrightVariant,
    legal.copyrightYear
  );

  const bogo = templates.find(
    (t) => t.slug === "bogoLoyalty" || t.id === "bogoLoyalty"
  );

  return (
    <SectionCard id="section-legal" title="Legal">
      {brief.loyaltyOnly === "yes" && (
        <div className="rounded-lg border border-campero-orange/30 bg-orange-50 px-3 py-2 text-sm text-stone-700">
          <strong className="text-campero-orange">Loyalty only:</strong>{" "}
          BOGO/Loyalty legal language is recommended
          {bogo ? ` (“${bogo.label}”).` : "."} Confirm redemption notes match
          Rewards drop instructions.
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <FieldLabel>Quick-select legal templates</FieldLabel>
          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
            {loading
              ? "Loading…"
              : source === "cloud"
                ? "From admin / Supabase"
                : "Built-in defaults"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => {
            const active = legal.templateId === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => applyTemplate(t)}
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
          {templates.length === 0 && !loading && (
            <p className="text-sm text-stone-400">
              No active templates. An admin can add them under Admin → Legal
              templates.
            </p>
          )}
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

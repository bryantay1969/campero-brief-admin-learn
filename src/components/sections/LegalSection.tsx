"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Pencil, RotateCcw, Save } from "lucide-react";

export function LegalSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const legal = brief.legal;
  const { canEdit } = useAuth();

  const [templates, setTemplates] = useState<LegalTemplateDef[]>(
    BUILTIN_LEGAL_TEMPLATES
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loading, setLoading] = useState(true);
  /** Local draft while editing the brief's legal block */
  const [draftText, setDraftText] = useState(legal.legalText);
  const [isEditing, setIsEditing] = useState(false);

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

  // Keep draft in sync when store legal text changes (template apply, load brief)
  useEffect(() => {
    if (!isEditing) {
      setDraftText(legal.legalText);
    }
  }, [legal.legalText, isEditing]);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (t) => t.slug === legal.templateId || t.id === legal.templateId
      ) || null,
    [templates, legal.templateId]
  );

  const matchesSelectedTemplate =
    !!selectedTemplate && legal.legalText.trim() === selectedTemplate.text.trim();

  const isCustom =
    legal.templateId === "custom" ||
    (!!selectedTemplate && !matchesSelectedTemplate);

  const draftDirty = draftText !== legal.legalText;

  const applyTemplate = (t: LegalTemplateDef) => {
    if (isEditing && draftDirty) {
      const ok = window.confirm(
        "You have unsaved edits to the legal block. Replace with this template?"
      );
      if (!ok) return;
    }
    patch("legal", {
      ...legal,
      templateId: t.slug,
      legalText: t.text,
    });
    setDraftText(t.text);
    setIsEditing(false);
  };

  const startEditing = () => {
    setDraftText(legal.legalText);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftText(legal.legalText);
    setIsEditing(false);
  };

  const saveEditing = () => {
    const text = draftText;
    const stillMatches = selectedTemplate
      ? text.trim() === selectedTemplate.text.trim()
      : false;
    patch("legal", {
      ...legal,
      templateId: stillMatches && selectedTemplate
        ? selectedTemplate.slug
        : "custom",
      legalText: text,
    });
    setIsEditing(false);
  };

  const resetToTemplate = () => {
    if (!selectedTemplate) return;
    if (isEditing && draftDirty) {
      const ok = window.confirm("Discard your edits and restore the template?");
      if (!ok) return;
    }
    patch("legal", {
      ...legal,
      templateId: selectedTemplate.slug,
      legalText: selectedTemplate.text,
    });
    setDraftText(selectedTemplate.text);
    setIsEditing(false);
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
          <FieldLabel>
            1. Choose a template
          </FieldLabel>
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
            const active =
              legal.templateId === t.slug ||
              (selectedTemplate?.slug === t.slug && !isCustom);
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => applyTemplate(t)}
                disabled={!canEdit}
                title={t.description}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  active && matchesSelectedTemplate
                    ? "border-campero-orange bg-orange-50 text-stone-900 shadow-sm"
                    : legal.templateId === t.slug ||
                        selectedTemplate?.slug === t.slug
                      ? "border-campero-orange/50 bg-orange-50/50 text-stone-800"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                  !canEdit && "opacity-60 cursor-not-allowed"
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

      {/* Status + actions for this brief's legal block */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 space-y-2",
          isEditing
            ? "border-campero-orange bg-orange-50/60"
            : isCustom
              ? "border-amber-200 bg-amber-50/50"
              : "border-stone-200 bg-stone-50/80"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              2. This brief&apos;s legal block
            </p>
            <p className="text-sm text-stone-800 mt-0.5">
              {isEditing ? (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold text-campero-orange">
                    <Pencil className="h-3.5 w-3.5" />
                    Editing
                  </span>
                  {draftDirty && (
                    <span className="ml-2 text-xs font-medium text-amber-700">
                      · unsaved changes
                    </span>
                  )}
                </>
              ) : isCustom ? (
                <>
                  <span className="font-semibold text-amber-800">
                    Customized for this brief
                  </span>
                  {selectedTemplate && (
                    <span className="text-stone-500">
                      {" "}
                      (started from “{selectedTemplate.label}”)
                    </span>
                  )}
                </>
              ) : selectedTemplate ? (
                <>
                  Using template:{" "}
                  <span className="font-semibold">
                    {selectedTemplate.label}
                  </span>
                </>
              ) : (
                <span className="font-semibold">Custom / free text</span>
              )}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Edits here apply only to this promo brief. To change the shared
              template for everyone, use{" "}
              <strong>Admin → Legal templates</strong>.
            </p>
          </div>
          {canEdit && !isEditing && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit legal text
              </button>
              {isCustom && selectedTemplate && (
                <button
                  type="button"
                  onClick={resetToTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to template
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 pt-1">
            <TextArea
              id="legalText"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="min-h-[160px] font-serif text-[13px] leading-relaxed bg-white border-campero-orange/40"
              rows={7}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveEditing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-campero-orange-dark"
              >
                <Save className="h-4 w-4" />
                Save to this brief
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={resetToTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore “{selectedTemplate.label}”
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1 rounded-lg border border-stone-200 bg-white px-3 py-3 text-[13px] font-serif leading-relaxed text-stone-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {legal.legalText || (
              <span className="text-stone-400 font-sans text-sm">
                No legal text yet. Choose a template above
                {canEdit ? ", then click Edit legal text if you need changes." : "."}
              </span>
            )}
          </div>
        )}
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
              disabled={!canEdit}
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
                  : "text-stone-600 hover:bg-white",
                !canEdit && "opacity-60 cursor-not-allowed"
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

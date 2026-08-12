"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { ExternalLink, Pencil, RotateCcw, Save } from "lucide-react";

export function LegalSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const legal = brief.legal;
  const { canEdit, canAdmin, isViewer } = useAuth();

  const [templates, setTemplates] = useState<LegalTemplateDef[]>(
    BUILTIN_LEGAL_TEMPLATES
  );
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(legal.legalText);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchLegalTemplatesForForm();
        if (cancelled) return;
        setTemplates(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (t) => t.slug === legal.templateId || t.id === legal.templateId
      ) || null,
    [templates, legal.templateId]
  );

  const matchesSelectedTemplate =
    !!selectedTemplate &&
    legal.legalText.trim() === selectedTemplate.text.trim();

  const draftDirty = isEditing && draftText !== legal.legalText;
  const displayText = isEditing ? draftText : legal.legalText;

  const applyTemplate = (t: LegalTemplateDef) => {
    if (isEditing && draftDirty) {
      const ok = window.confirm(
        "You have unsaved edits. Replace the editor with this template?"
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
    setMessage(null);
  };

  const startEditBriefOnly = () => {
    setDraftText(legal.legalText);
    setIsEditing(true);
    setMessage(null);
  };

  const cancelEditing = () => {
    setDraftText(legal.legalText);
    setIsEditing(false);
  };

  const saveBriefOnly = () => {
    if (!canEdit) return;
    const stillMatches =
      selectedTemplate &&
      draftText.trim() === selectedTemplate.text.trim();
    patch("legal", {
      ...legal,
      templateId:
        stillMatches && selectedTemplate
          ? selectedTemplate.slug
          : "custom",
      legalText: draftText,
    });
    setIsEditing(false);
    setMessage(
      stillMatches
        ? "Legal text matches the shared template."
        : "Saved for this brief only. Shared templates were not changed."
    );
  };

  const resetToShared = () => {
    if (!selectedTemplate) return;
    patch("legal", {
      ...legal,
      templateId: selectedTemplate.slug,
      legalText: selectedTemplate.text,
    });
    setDraftText(selectedTemplate.text);
    setIsEditing(false);
    setMessage(`Restored shared template “${selectedTemplate.label}”.`);
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
      {/* Top bar: status left, Manage top-right (same pattern as Paid / Digital) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {loading
            ? "Loading templates…"
            : "Pick a template or edit text for this brief only"}
        </p>
        {canAdmin && (
          <Link
            href="/admin/legal/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage all templates
          </Link>
        )}
      </div>

      {brief.loyaltyOnly === "yes" && (
        <div className="rounded-lg border border-campero-orange/30 bg-orange-50 px-3 py-2 text-sm text-stone-700">
          <strong className="text-campero-orange">Loyalty only:</strong>{" "}
          BOGO/Loyalty is recommended
          {bogo ? ` (“${bogo.label}”).` : "."} Confirm redemption notes match
          Rewards drop instructions.
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      )}

      {/* Shared template library (pick only) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <FieldLabel>Shared templates</FieldLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => {
            const selected = legal.templateId === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => applyTemplate(t)}
                disabled={isViewer}
                title={t.description}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "border-campero-orange bg-orange-50 text-stone-900 shadow-sm ring-1 ring-campero-orange/30"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                  isViewer && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className="font-semibold block">{t.label}</span>
                <span className="text-xs text-stone-500">{t.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legal text for this brief only */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 space-y-3",
          isEditing
            ? "border-campero-orange bg-orange-50/50"
            : "border-stone-200 bg-stone-50/80"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Legal text on this brief
            </p>
            {!isEditing && (
              <p className="text-sm text-stone-800 mt-0.5">
                {selectedTemplate && matchesSelectedTemplate ? (
                  <>
                    Using shared template{" "}
                    <strong>{selectedTemplate.label}</strong>
                  </>
                ) : selectedTemplate ? (
                  <>
                    Differs from shared template{" "}
                    <strong>{selectedTemplate.label}</strong>{" "}
                    <span className="text-stone-500">(this brief only)</span>
                  </>
                ) : (
                  <>
                    Custom text on this brief{" "}
                    <span className="text-stone-500">
                      (not a library template)
                    </span>
                  </>
                )}
              </p>
            )}
            {isEditing && (
              <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5 text-campero-orange">
                <Pencil className="h-3.5 w-3.5" />
                Editing this brief only
                {draftDirty ? " · unsaved" : ""}
              </p>
            )}
          </div>

          {canEdit && !isEditing && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startEditBriefOnly}
                className="inline-flex items-center gap-1.5 rounded-lg border border-campero-orange/40 bg-orange-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-orange-100"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit for this brief only
              </button>
              {!matchesSelectedTemplate && selectedTemplate && (
                <button
                  type="button"
                  onClick={resetToShared}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Use shared version
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <p className="text-xs text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <strong>This brief only.</strong> Does not change the shared
              template library. To change a template for everyone, use{" "}
              {canAdmin ? (
                <Link
                  href="/admin/legal/"
                  className="font-semibold underline underline-offset-2"
                >
                  Manage all templates
                </Link>
              ) : (
                "Manage all templates (admin)"
              )}
              .
            </p>
            <TextArea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="min-h-[160px] font-serif text-[13px] leading-relaxed bg-white"
              rows={8}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveBriefOnly}
                className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-campero-orange-dark"
              >
                <Save className="h-4 w-4" />
                Save for this brief only
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white px-3 py-3 text-[13px] font-serif leading-relaxed text-stone-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {displayText || (
              <span className="text-stone-400 font-sans text-sm">
                Choose a shared template above to fill this brief.
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextArea,
  TextInput,
} from "@/components/ui/FormControls";
import {
  BUILTIN_LEGAL_TEMPLATES,
  getCopyrightLine,
  type LegalTemplateDef,
} from "@/lib/legalTemplates";
import {
  createLegalTemplate,
  fetchLegalTemplatesForForm,
  saveSharedLegalTemplate,
} from "@/lib/supabase/legalTemplatesApi";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { ExternalLink, Pencil, Plus, RotateCcw, Save } from "lucide-react";

export function LegalSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const legal = brief.legal;
  const { canEdit, canAdmin, isViewer } = useAuth();

  const [templates, setTemplates] = useState<LegalTemplateDef[]>(
    BUILTIN_LEGAL_TEMPLATES
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  /** Admin shared (global) vs one-off text on this brief only */
  const [editMode, setEditMode] = useState<"shared" | "brief">("shared");
  const [draftText, setDraftText] = useState(legal.legalText);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBody, setNewBody] = useState("");

  const reloadTemplates = async () => {
    setLoading(true);
    try {
      const list = await fetchLegalTemplatesForForm();
      setTemplates(list);
      setSource(list.some((t) => t.dbId) ? "cloud" : "builtin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadTemplates();
  }, []);

  useEffect(() => {
    if (!isEditing) setDraftText(legal.legalText);
  }, [legal.legalText, isEditing]);

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

  const draftDirty = draftText !== legal.legalText;
  const draftDiffersFromShared =
    !!selectedTemplate &&
    draftText.trim() !== selectedTemplate.text.trim();

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
    setError(null);
  };

  /** Admin: edit the global shared template (not this brief only). */
  const startEditShared = () => {
    if (!selectedTemplate) {
      window.alert(
        "Select a template chip first, then edit that shared template for everyone."
      );
      return;
    }
    setEditMode("shared");
    setDraftText(selectedTemplate.text);
    setIsEditing(true);
    setMessage(null);
    setError(null);
  };

  /** One-off override on this promo only (does not change shared library). */
  const startEditBriefOnly = () => {
    setEditMode("brief");
    setDraftText(legal.legalText);
    setIsEditing(true);
    setMessage(null);
    setError(null);
  };

  const cancelEditing = () => {
    setDraftText(legal.legalText);
    setIsEditing(false);
    setError(null);
  };

  const saveSharedTemplate = async () => {
    if (!canAdmin || !selectedTemplate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await saveSharedLegalTemplate({
        slug: selectedTemplate.slug,
        label: selectedTemplate.label,
        description: selectedTemplate.description,
        body: draftText,
        sort_order: selectedTemplate.sortOrder,
      });
      await reloadTemplates();
      // Keep this open brief in sync with the new global text
      patch("legal", {
        ...legal,
        templateId: updated.slug,
        legalText: updated.body,
      });
      setDraftText(updated.body);
      setIsEditing(false);
      setMessage(
        `Global template “${updated.label}” saved. Everyone sees this chip with the new text. New briefs that pick it get this version. (Already-saved briefs keep their own copy until someone re-selects the chip.)`
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not save shared template";
      setError(
        msg.includes("relation") || msg.includes("does not exist")
          ? `${msg} — Run supabase/legal-templates.sql in the Supabase SQL Editor first.`
          : msg
      );
    } finally {
      setSaving(false);
    }
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
        : "One-off legal text saved on this brief only. The shared template library was not changed."
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

  const createNewShared = async () => {
    if (!canAdmin) return;
    setSaving(true);
    setError(null);
    try {
      const slug =
        newSlug.trim() ||
        newLabel
          .trim()
          .replace(/\s+/g, "")
          .replace(/[^a-zA-Z0-9_-]/g, "") ||
        `template${Date.now()}`;
      const created = await createLegalTemplate({
        slug,
        label: newLabel.trim(),
        description: newDescription.trim(),
        body: newBody.trim(),
        sort_order: 100 + templates.length * 10,
        is_active: true,
      });
      await reloadTemplates();
      patch("legal", {
        ...legal,
        templateId: created.slug,
        legalText: created.body,
      });
      setShowNew(false);
      setNewLabel("");
      setNewSlug("");
      setNewDescription("");
      setNewBody("");
      setMessage(
        `New shared template “${created.label}” is available to everyone on the Legal tab.`
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not create template";
      setError(
        msg.includes("relation") || msg.includes("does not exist")
          ? `${msg} — Run supabase/legal-templates.sql in the Supabase SQL Editor first.`
          : msg
      );
    } finally {
      setSaving(false);
    }
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
          BOGO/Loyalty is recommended
          {bogo ? ` (“${bogo.label}”).` : "."} Confirm redemption notes match
          Rewards drop instructions.
        </div>
      )}

      {canAdmin && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-950">
          <strong>Admin · global templates.</strong> Edits and new templates
          update the shared library for <strong>everyone</strong>. New briefs
          that pick a chip get the latest text. Use “Save for this brief only”
          when a single promo needs different legal language.
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Shared template library */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <FieldLabel>Shared templates (global library)</FieldLabel>
          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
            {loading
              ? "Loading…"
              : source === "cloud"
                ? "From Supabase · live for all users"
                : "Built-in fallback · save once to publish to cloud"}
          </span>
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
        {canAdmin && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNew(true);
                setError(null);
                setMessage(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add template for everyone
            </button>
            <Link
              href="/admin/legal/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage all templates
            </Link>
          </div>
        )}
      </div>

      {/* Current brief text + actions */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 space-y-3",
          isEditing
            ? editMode === "shared"
              ? "border-violet-300 bg-violet-50/50"
              : "border-amber-300 bg-amber-50/40"
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
                    Matches shared template{" "}
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
                    <span className="text-stone-500">(not a library template)</span>
                  </>
                )}
              </p>
            )}
            {isEditing && (
              <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                {editMode === "shared" ? (
                  <span className="text-violet-800">
                    Editing for everyone
                    {selectedTemplate
                      ? ` “${selectedTemplate.label}”`
                      : ""}{" "}
                    — all users · new briefs
                  </span>
                ) : (
                  <span className="text-amber-900">
                    Editing for this brief only
                    {draftDirty ? " · unsaved" : ""}
                  </span>
                )}
              </p>
            )}
          </div>

          {canEdit && !isEditing && (
            <div className="flex flex-wrap gap-2">
              {canAdmin && selectedTemplate && (
                <button
                  type="button"
                  onClick={startEditShared}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit for everyone
                </button>
              )}
              <button
                type="button"
                onClick={startEditBriefOnly}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
                  canAdmin
                    ? "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    : "border-campero-orange/40 bg-orange-50 text-stone-800 hover:bg-orange-100"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                {canAdmin ? "Save for this brief only" : "Edit legal text"}
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
            {editMode === "shared" && (
              <p className="text-xs text-violet-900 bg-violet-100/80 border border-violet-200 rounded-lg px-3 py-2">
                <strong>Global save.</strong> Updates the shared template for{" "}
                <strong>all users</strong>. Anyone who opens Legal and picks
                this chip (including on <strong>new briefs</strong>) gets this
                text. Briefs already saved keep their old copy until the chip is
                selected again.
              </p>
            )}
            {editMode === "brief" && (
              <p className="text-xs text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <strong>This brief only.</strong> Does not change the shared
                template library or other users’ defaults.
              </p>
            )}
            <TextArea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="min-h-[160px] font-serif text-[13px] leading-relaxed bg-white"
              rows={8}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {editMode === "shared" ? (
                <button
                  type="button"
                  disabled={saving || !draftDiffersFromShared}
                  onClick={() => void saveSharedTemplate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save for everyone"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveBriefOnly}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-campero-orange-dark"
                >
                  <Save className="h-4 w-4" />
                  Save for this brief only
                </button>
              )}
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
            {legal.legalText || (
              <span className="text-stone-400 font-sans text-sm">
                Choose a shared template above to fill this brief.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Admin: create new shared template for everyone */}
      {showNew && canAdmin && (
        <div className="rounded-xl border border-violet-300 bg-violet-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-violet-900">
                Add template for everyone
              </p>
              <p className="text-xs text-violet-800 mt-0.5">
                Creates a new chip on the Legal tab for all users.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="text-xs font-semibold text-stone-500"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Label</FieldLabel>
              <TextInput
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Catering promo"
              />
            </div>
            <div>
              <FieldLabel hint="Short id, no spaces">Slug</FieldLabel>
              <TextInput
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. cateringPromo"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Short description</FieldLabel>
            <TextInput
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Shown under the chip"
            />
          </div>
          <div>
            <FieldLabel>Legal text</FieldLabel>
            <TextArea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={5}
              className="font-serif text-sm"
            />
          </div>
          <button
            type="button"
            disabled={saving || !newLabel.trim() || !newBody.trim()}
            onClick={() => void createNewShared()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Creating…" : "Create shared template"}
          </button>
        </div>
      )}

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

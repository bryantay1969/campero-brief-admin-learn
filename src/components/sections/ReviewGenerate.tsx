"use client";

import { useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import { SectionCard } from "@/components/ui/FormControls";
import { BriefPreview } from "@/components/preview/BriefPreview";
import { briefToMarkdown } from "@/lib/markdown";
import { downloadBriefPdf } from "@/lib/pdf";
import { defaultBriefName } from "@/lib/briefIds";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Save,
} from "lucide-react";

export function ReviewGenerate() {
  const brief = useBriefStore((s) => s.brief);
  const showPreview = useBriefStore((s) => s.showPreview);
  const setShowPreview = useBriefStore((s) => s.setShowPreview);
  const saveToLibrary = useBriefStore((s) => s.saveToLibrary);
  const setShowLibrary = useBriefStore((s) => s.setShowLibrary);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const isDirty = useBriefStore((s) => s.isDirty);
  const library = useBriefStore((s) => s.library);
  const { canEdit } = useAuth();

  const [pdfLoading, setPdfLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok">("idle");

  const handleGenerate = () => {
    setShowPreview(true);
    setPdfError(null);
    requestAnimationFrame(() => {
      document
        .getElementById("brief-preview-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handlePdf = async () => {
    if (!showPreview) setShowPreview(true);
    setPdfLoading(true);
    setPdfError(null);
    try {
      // Allow preview to paint
      await new Promise((r) => setTimeout(r, 150));
      await downloadBriefPdf(brief);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefToMarkdown(brief));
      setCopyStatus("ok");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("err");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handleSave = () => {
    if (!canEdit) {
      window.alert(
        "Your account is view-only. Ask an admin to grant editor access to save."
      );
      return;
    }
    const active = library.find((b) => b.id === activeBriefId);
    saveToLibrary(
      active?.name || defaultBriefName(brief.promoName, brief.projectLead)
    );
    setSaveStatus("ok");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const checklist = [
    { ok: !!brief.projectLead, label: "Project Lead" },
    { ok: !!brief.promoName, label: "Promo name" },
    { ok: !!brief.launchDate, label: "Launch date" },
    { ok: !!brief.locations, label: "Locations" },
    {
      ok: brief.messagingBullets.some((b) => b.text.trim()),
      label: "Messaging",
    },
    { ok: !!brief.legal.legalText.trim(), label: "Legal language" },
  ];

  return (
    <SectionCard id="section-review" title="Review & Generate">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checklist.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              item.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-stone-50 text-stone-500"
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${item.ok ? "text-emerald-600" : "text-stone-300"}`}
            />
            {item.label}
          </div>
        ))}
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You are in <strong>view only</strong> mode. You can preview and
          download, but not save changes to the shared library.
        </div>
      )}

      {canEdit && (isDirty || !activeBriefId) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {activeBriefId
            ? "You have unsaved edits. Save to keep them for later revisits."
            : "This brief is not in your library yet. Save it so you can reopen it when the project changes."}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl border border-campero-orange/30 bg-orange-50 px-5 py-3 text-sm font-bold text-campero-orange shadow-sm hover:bg-orange-100 transition-colors"
          >
            {saveStatus === "ok" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === "ok"
              ? "Saved to library!"
              : activeBriefId
                ? "Save changes"
                : "Save to library"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-campero-orange/40 hover:bg-orange-50 transition-colors"
        >
          <FolderOpen className="h-4 w-4" />
          My briefs
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-campero-orange px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-campero-orange-dark transition-colors"
        >
          <Eye className="h-4 w-4" />
          Generate Brief
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-campero-orange/40 hover:bg-orange-50 transition-colors disabled:opacity-60"
        >
          {pdfLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-campero-orange/40 hover:bg-orange-50 transition-colors"
        >
          {copyStatus === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copyStatus === "ok"
            ? "Copied!"
            : copyStatus === "err"
              ? "Copy failed"
              : "Copy as Markdown"}
        </button>
      </div>

      {pdfError && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {pdfError}
        </p>
      )}

      {showPreview && (
        <div id="brief-preview-anchor" className="pt-2">
          <p className="text-sm font-semibold text-stone-600 mb-3">
            Web preview
          </p>
          <div className="flex justify-center overflow-x-auto rounded-xl bg-stone-100/80 p-4 sm:p-6 border border-stone-200">
            <BriefPreview brief={brief} />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

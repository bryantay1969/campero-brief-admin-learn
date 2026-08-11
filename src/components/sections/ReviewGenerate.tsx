"use client";

import { useEffect, useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import { SectionCard } from "@/components/ui/FormControls";
import { BriefPreview } from "@/components/preview/BriefPreview";
import { downloadBriefPdf } from "@/lib/pdf";
import { getOrCreatePreviewUrl } from "@/lib/supabase/briefsApi";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CheckCircle2,
  Download,
  FileText,
  Link2,
  Loader2,
} from "lucide-react";

export function ReviewGenerate() {
  const brief = useBriefStore((s) => s.brief);
  const setShowPreview = useBriefStore((s) => s.setShowPreview);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const { canEdit, cloudEnabled } = useAuth();

  const [pdfLoading, setPdfLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");
  const [copyBusy, setCopyBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Always show the generated brief when Review is open
  useEffect(() => {
    setShowPreview(true);
  }, [setShowPreview]);

  const handlePdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      await new Promise((r) => setTimeout(r, 100));
      await downloadBriefPdf(brief);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activeBriefId) {
      window.alert(
        "This brief isn’t saved yet. Use Save and Continue (or change section) so it has a cloud copy, then copy the public preview link."
      );
      return;
    }
    if (!cloudEnabled) {
      window.alert(
        "Sign in with cloud enabled to create a public preview link."
      );
      return;
    }
    setCopyBusy(true);
    setLinkError(null);
    try {
      const { url } = await getOrCreatePreviewUrl(activeBriefId);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt("Copy this public preview link:", url);
      }
      setCopyStatus("ok");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not create preview link";
      setLinkError(msg);
      setCopyStatus("err");
      setTimeout(() => setCopyStatus("idle"), 3000);
    } finally {
      setCopyBusy(false);
    }
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
    <SectionCard id="section-review" title="Review">
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
          download, but not change the shared library.
        </div>
      )}

      {canEdit && (
        <p className="text-xs text-stone-500">
          Briefs save when you move to another section tab. This page shows a
          live preview.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-campero-orange px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-campero-orange-dark transition-colors disabled:opacity-60"
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
          disabled={copyBusy}
          onClick={() => void handleCopyLink()}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-campero-orange/40 hover:bg-orange-50 transition-colors disabled:opacity-60"
          title="Copy a public, view-only preview link (no login, no edit)"
        >
          {copyBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copyStatus === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copyBusy
            ? "Creating link…"
            : copyStatus === "ok"
              ? "Preview link copied!"
              : copyStatus === "err"
                ? "Copy failed"
                : "Copy preview link"}
        </button>
      </div>

      <p className="text-xs text-stone-500">
        <strong>Copy preview link</strong> shares a public, read-only page of
        this brief. Anyone with the link can view the preview — they cannot
        edit.
      </p>

      {pdfError && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {pdfError}
        </p>
      )}
      {linkError && (
        <p className="text-sm text-red-600 whitespace-pre-wrap">{linkError}</p>
      )}

      <div id="brief-preview-anchor" className="pt-2">
        <p className="text-sm font-semibold text-stone-600 mb-3">
          Brief preview
        </p>
        <div className="flex justify-center overflow-x-auto rounded-xl bg-stone-100/80 p-4 sm:p-6 border border-stone-200">
          <BriefPreview brief={brief} />
        </div>
      </div>
    </SectionCard>
  );
}

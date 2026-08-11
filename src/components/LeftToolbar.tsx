"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBriefStore } from "@/store/briefStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  BookOpen,
  Check,
  Eraser,
  FilePlus2,
  FileStack,
  FolderOpen,
  Loader2,
  LogOut,
  PanelLeftClose,
  Shield,
} from "lucide-react";

type LeftToolbarProps = {
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  onSave: () => void | Promise<void>;
  onHide?: () => void;
};

export function LeftToolbar({
  saveStatus,
  saveError,
  onSave,
  onHide,
}: LeftToolbarProps) {
  const router = useRouter();
  const brief = useBriefStore((s) => s.brief);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const isDirty = useBriefStore((s) => s.isDirty);
  const setShowLibrary = useBriefStore((s) => s.setShowLibrary);
  const setShowGuidelines = useBriefStore((s) => s.setShowGuidelines);
  const newBrief = useBriefStore((s) => s.newBrief);
  const loadSample = useBriefStore((s) => s.loadSample);
  const clearForm = useBriefStore((s) => s.clearForm);

  const {
    configured,
    loading,
    user,
    role,
    canAdmin,
    canEdit,
    isViewer,
    cloudEnabled,
    refreshCloudLibrary,
    signOut,
  } = useAuth();

  const active = library.find((b) => b.id === activeBriefId);
  const preferNewDraft = useBriefStore((s) => s.preferNewDraft);
  const [newBriefFlash, setNewBriefFlash] = useState(false);
  const [newBriefBusy, setNewBriefBusy] = useState(false);

  const handleNewBrief = () => {
    if (!canEdit) {
      window.alert("View only — you cannot create a new brief.");
      return;
    }
    if (newBriefBusy) return;

    const hasOpenBrief = !!activeBriefId;
    const hasTypedContent =
      !!brief.promoName.trim() ||
      !!brief.projectLead.trim() ||
      !!brief.locations.trim() ||
      brief.messagingBullets.some((b) => b.text.trim()) ||
      !!brief.legal.legalText.trim() ||
      isDirty;

    if (hasOpenBrief || hasTypedContent) {
      const ok = window.confirm(
        [
          "Start a new empty brief?",
          "",
          "WARNING: Content in the current brief will NOT be saved.",
          "Unsaved edits on this form will be discarded.",
          "",
          "Briefs already saved in My briefs are kept.",
        ].join("\n")
      );
      if (!ok) return;
    }

    setNewBriefBusy(true);
    newBrief();
    setNewBriefFlash(true);
    window.setTimeout(() => setNewBriefFlash(false), 2200);
    setNewBriefBusy(false);
  };

  const handleLoadSample = () => {
    if (isDirty) {
      const ok = window.confirm(
        "Load the sample brief? Current form content will be replaced. Saved library briefs are not deleted."
      );
      if (!ok) return;
    }
    loadSample();
  };

  const handleClear = () => {
    if (
      window.confirm(
        [
          "Clear brief?",
          "",
          "WARNING: This will erase all content in the current brief.",
          "This cannot be undone for unsaved work.",
          "",
          "Other briefs in My briefs are not deleted.",
        ].join("\n")
      )
    ) {
      clearForm();
    }
  };

  const saveLabel = (() => {
    if (!canEdit) return "View only";
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "error") return "Save failed";
    if (saveStatus === "saved")
      return cloudEnabled ? "Saved to cloud" : "Saved";
    if (isDirty) return "Unsaved · saves on next tab";
    if (activeBriefId) return "Saved";
    return "New empty draft";
  })();

  const navBtn =
    "w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-orange-100 bg-white">
      {/* Brand + hide */}
      <div className="shrink-0 border-b border-orange-50 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D04] to-[#FFBA08] text-white font-black text-xs shadow-md shadow-orange-200">
              PC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-stone-900 leading-tight">
                Promo Brief
              </p>
              <p className="text-[10px] text-stone-500 truncate">
                Campero builder
              </p>
            </div>
          </div>
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              className="shrink-0 rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              title="Hide toolbar"
              aria-label="Hide left toolbar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Current brief + save status */}
      <div className="shrink-0 border-b border-stone-100 px-3 py-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1">
          Current brief
        </p>
        <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
          <p className="text-xs font-semibold text-stone-800 truncate">
            {active?.name ||
              brief.promoName.trim() ||
              (preferNewDraft || !activeBriefId
                ? isViewer
                  ? "Browsing"
                  : "New empty brief"
                : "Untitled draft")}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                saveStatus === "error"
                  ? "bg-red-500"
                  : saveStatus === "saving" || isDirty
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
            />
            <span
              className={cn(
                "font-medium",
                saveStatus === "error"
                  ? "text-red-700"
                  : saveStatus === "saving" || isDirty
                    ? "text-amber-800"
                    : "text-stone-500"
              )}
            >
              {saveStatus === "saving" && (
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              )}
              {saveLabel}
            </span>
            {brief.lastSaved && !isDirty && saveStatus !== "saving" && (
              <span className="text-stone-400 truncate">
                · {format(new Date(brief.lastSaved), "h:mm a")}
              </span>
            )}
          </div>
          {saveError && (
            <button
              type="button"
              onClick={() => void onSave()}
              className="mt-1 text-[11px] font-semibold text-red-600 underline"
            >
              Retry save
            </button>
          )}
        </div>
      </div>

      {/* Primary actions */}
      <div className="shrink-0 border-b border-stone-100 px-3 py-3 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1 mb-1">
          Briefs
        </p>
        {canEdit && (
          <button
            type="button"
            disabled={newBriefBusy}
            onClick={handleNewBrief}
            className={cn(
              navBtn,
              newBriefFlash
                ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border border-dashed border-campero-orange/50 bg-orange-50/50 text-campero-orange hover:bg-orange-50 hover:border-campero-orange"
            )}
          >
            {newBriefFlash ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
            )}
            {newBriefBusy
              ? "Starting…"
              : newBriefFlash
                ? "Empty brief ready"
                : "New empty brief"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setShowLibrary(true);
            if (cloudEnabled) void refreshCloudLibrary();
          }}
          className={cn(
            navBtn,
            "border border-stone-200 bg-white text-stone-700 hover:border-campero-orange/40 hover:bg-orange-50"
          )}
        >
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          Show briefs
          {library.length > 0 && (
            <span className="ml-auto rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
              {library.length}
            </span>
          )}
        </button>
      </div>

      {/* Tools + account (scroll if needed) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1 mb-1">
          Tools
        </p>
        <button
          type="button"
          onClick={() => setShowGuidelines(true)}
          className={cn(
            navBtn,
            "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          )}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          Brand guidelines
        </button>
        <button
          type="button"
          onClick={handleLoadSample}
          className={cn(
            navBtn,
            "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          )}
        >
          <FileStack className="h-3.5 w-3.5 shrink-0" />
          Load sample
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              navBtn,
              "border border-stone-200 bg-white text-stone-600 hover:border-red-100 hover:bg-red-50 hover:text-red-700"
            )}
          >
            <Eraser className="h-3.5 w-3.5 shrink-0" />
            Clear brief
          </button>
        )}

        <div className="pt-2 mt-1 border-t border-stone-100 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1 mb-1">
            Account
          </p>
          {!configured && (
            <p className="px-1 text-[11px] text-amber-700">
              Add Supabase keys to .env.local
            </p>
          )}
          {configured && !loading && user && (
            <>
              <p
                className="px-1 text-[11px] text-stone-500 truncate"
                title={user.email || user.id}
              >
                {user.email || "Signed in"}
                {role ? ` · ${role}` : ""}
              </p>
              {isViewer && (
                <span className="mx-1 inline-flex rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  Viewer
                </span>
              )}
              {canAdmin && (
                <Link
                  href="/admin/"
                  className={cn(
                    navBtn,
                    "border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                  )}
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.replace("/login/");
                }}
                className={cn(
                  navBtn,
                  "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                )}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

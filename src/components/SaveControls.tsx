"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import { defaultBriefName } from "@/lib/briefIds";
import { useAuth } from "@/components/auth/AuthProvider";
import { upsertCloudBrief } from "@/lib/supabase/briefsApi";
import { FolderOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";

const AUTOSAVE_MS = 1200;

export function SaveControls() {
  const brief = useBriefStore((s) => s.brief);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const isDirty = useBriefStore((s) => s.isDirty);
  const activeSection = useBriefStore((s) => s.activeSection);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);
  const setShowLibrary = useBriefStore((s) => s.setShowLibrary);
  const hydrated = useBriefStore((s) => s.hydrated);

  const { cloudEnabled, user, canEdit, isViewer, refreshCloudLibrary } =
    useAuth();

  const [status, setStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const prevSectionRef = useRef(activeSection);

  const active = library.find((b) => b.id === activeBriefId);

  const runSave = useCallback(async () => {
    if (!canEdit || !hydrated || savingRef.current) return;

    const state = useBriefStore.getState();
    if (!state.isDirty) return;

    const name =
      state.library.find((b) => b.id === state.activeBriefId)?.name ||
      defaultBriefName(state.brief.promoName, state.brief.projectLead);

    // Skip autosave until there's something meaningful (avoids junk empty drafts)
    const hasContent =
      !!state.brief.promoName.trim() ||
      !!state.brief.projectLead.trim() ||
      !!state.brief.locations.trim() ||
      state.brief.messagingBullets.some((b) => b.text.trim()) ||
      !!state.brief.legal.legalText.trim();
    if (!hasContent && !state.activeBriefId) return;

    savingRef.current = true;
    setStatus("saving");
    setError(null);

    try {
      const local = state.saveToLibrary(name);

      if (cloudEnabled && user) {
        const saved = await upsertCloudBrief({
          id: local.id,
          name: local.name,
          brief: local.brief,
          userId: user.id,
        });
        applyCloudSave(saved);
        await refreshCloudLibrary();
      }

      setStatus("saved");
      window.setTimeout(() => {
        setStatus((s) => (s === "saved" ? "idle" : s));
      }, 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auto-save failed";
      console.error("Auto-save failed:", e);
      setError(msg);
      setStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [
    canEdit,
    hydrated,
    cloudEnabled,
    user,
    applyCloudSave,
    refreshCloudLibrary,
  ]);

  // Debounced auto-save while editing
  useEffect(() => {
    if (!hydrated || !canEdit || !isDirty) {
      if (!isDirty && status === "pending") setStatus("idle");
      return;
    }
    setStatus("pending");
    const t = window.setTimeout(() => {
      void runSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
    // brief identity changes drive dirty; rely on isDirty + section for tab saves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, brief, hydrated, canEdit, runSave]);

  // Save when switching tabs / sections
  useEffect(() => {
    if (prevSectionRef.current === activeSection) return;
    prevSectionRef.current = activeSection;
    if (!hydrated || !canEdit) return;
    if (useBriefStore.getState().isDirty) {
      void runSave();
    }
  }, [activeSection, hydrated, canEdit, runSave]);

  // Save when leaving the page / switching tabs in the browser
  useEffect(() => {
    const onHide = () => {
      if (useBriefStore.getState().isDirty && canEdit) {
        void runSave();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canEdit, runSave]);

  if (!hydrated) return null;

  const statusLabel = (() => {
    if (!canEdit) return "View only";
    if (status === "saving") return "Saving…";
    if (status === "pending") return "Saving soon…";
    if (status === "error") return "Save failed";
    if (status === "saved") return cloudEnabled ? "Saved to cloud" : "Saved";
    if (isDirty) return "Unsaved changes";
    if (activeBriefId) return "Saved";
    return "Draft";
  })();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isViewer && (
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">
          View only
        </span>
      )}

      {active ? (
        <span className="hidden md:inline-flex max-w-[220px] items-center gap-1.5 text-xs text-stone-500 truncate">
          <span
            className={
              status === "saving" || status === "pending" || isDirty
                ? "h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                : status === "error"
                  ? "h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"
                  : "h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
            }
          />
          <span className="truncate font-medium text-stone-700">
            {active.name}
          </span>
          {brief.lastSaved && !isDirty && status !== "saving" ? (
            <span className="text-stone-400 shrink-0">
              · {format(new Date(brief.lastSaved), "h:mm a")}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-400">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
          {isViewer ? "Browsing" : "New draft"}
        </span>
      )}

      {canEdit && (
        <span
          className={
            status === "error"
              ? "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700"
              : status === "saving" || status === "pending"
                ? "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800"
                : "inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800"
          }
          title={error || "Briefs auto-save as you edit and when you change tabs"}
        >
          {(status === "saving" || status === "pending") && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {statusLabel}
        </span>
      )}

      <button
        type="button"
        onClick={() => {
          setShowLibrary(true);
          if (cloudEnabled) void refreshCloudLibrary();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-campero-orange/40 hover:bg-orange-50"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        My briefs
        {library.length > 0 && (
          <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
            {library.length}
          </span>
        )}
      </button>

      {error && (
        <button
          type="button"
          onClick={() => void runSave()}
          className="text-[11px] font-semibold text-red-600 underline underline-offset-2"
          title={error}
        >
          Retry save
        </button>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useBriefStore } from "@/store/briefStore";
import { defaultBriefName } from "@/lib/briefIds";
import { useAuth } from "@/components/auth/AuthProvider";
import { upsertCloudBrief } from "@/lib/supabase/briefsApi";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves only when the user changes section (advances/jumps tabs).
 * No debounced typing saves.
 */
export function AutoSaveEngine({
  children,
}: {
  children: (api: {
    status: AutoSaveStatus;
    error: string | null;
    runSave: () => Promise<void>;
  }) => ReactNode;
}) {
  const isDirty = useBriefStore((s) => s.isDirty);
  const activeSection = useBriefStore((s) => s.activeSection);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);
  const hydrated = useBriefStore((s) => s.hydrated);

  const { cloudEnabled, user, canEdit, refreshCloudLibrary } = useAuth();

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const prevSectionRef = useRef(activeSection);
  const hydratedRef = useRef(false);

  const runSave = useCallback(async () => {
    if (!canEdit || !hydrated || savingRef.current) return;

    const state = useBriefStore.getState();
    if (!state.isDirty) return;

    const name =
      state.library.find((b) => b.id === state.activeBriefId)?.name ||
      defaultBriefName(state.brief.promoName, state.brief.projectLead);

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
      const msg = e instanceof Error ? e.message : "Save failed";
      console.error("Tab save failed:", e);
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

  // Save only when the active section changes (next/prev or section chip)
  useEffect(() => {
    if (!hydrated) return;

    // Skip the first run after mount/hydrate so we don't save on load
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      prevSectionRef.current = activeSection;
      return;
    }

    if (prevSectionRef.current === activeSection) return;
    prevSectionRef.current = activeSection;

    if (!canEdit) return;
    if (useBriefStore.getState().isDirty) {
      void runSave();
    }
  }, [activeSection, hydrated, canEdit, runSave]);

  // Reflect unsaved state without auto-saving
  useEffect(() => {
    if (!hydrated || !canEdit) return;
    if (status === "saving" || status === "error") return;
    if (isDirty && status === "saved") setStatus("idle");
  }, [isDirty, hydrated, canEdit, status]);

  return <>{children({ status, error, runSave })}</>;
}

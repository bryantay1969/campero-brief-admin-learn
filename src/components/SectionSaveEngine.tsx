"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useBriefStore } from "@/store/briefStore";
import { defaultBriefName } from "@/lib/briefIds";
import { useAuth } from "@/components/auth/AuthProvider";
import { upsertCloudBrief } from "@/lib/supabase/briefsApi";

export type SectionSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves the open brief when the user changes section tabs
 * (Save and Continue / section chips). No save-on-keystroke.
 */
export function SectionSaveEngine({
  children,
}: {
  children: (api: {
    status: SectionSaveStatus;
    error: string | null;
    runSave: () => Promise<void>;
  }) => ReactNode;
}) {
  const activeSection = useBriefStore((s) => s.activeSection);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);
  const hydrated = useBriefStore((s) => s.hydrated);
  const { cloudEnabled, user, canEdit, refreshCloudLibrary } = useAuth();

  const [status, setStatus] = useState<SectionSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const prevSectionRef = useRef(activeSection);
  const skipFirstSectionEffect = useRef(true);

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
      !!state.brief.messagingBullets.trim() ||
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
      console.error("Section save failed:", e);
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

  useEffect(() => {
    if (!hydrated) return;

    if (skipFirstSectionEffect.current) {
      skipFirstSectionEffect.current = false;
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

  return <>{children({ status, error, runSave })}</>;
}

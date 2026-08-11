"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useBriefStore } from "@/store/briefStore";
import { defaultBriefName } from "@/lib/briefIds";
import { useAuth } from "@/components/auth/AuthProvider";
import { upsertCloudBrief } from "@/lib/supabase/briefsApi";

const AUTOSAVE_MS = 1200;

export type AutoSaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "error";

/**
 * Headless auto-save engine. Renders nothing; reports status via children render prop
 * or can be used only for side effects with onStatusChange.
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
  const brief = useBriefStore((s) => s.brief);
  const isDirty = useBriefStore((s) => s.isDirty);
  const activeSection = useBriefStore((s) => s.activeSection);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);
  const hydrated = useBriefStore((s) => s.hydrated);

  const { cloudEnabled, user, canEdit, refreshCloudLibrary } = useAuth();

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const prevSectionRef = useRef(activeSection);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, brief, hydrated, canEdit, runSave]);

  useEffect(() => {
    if (prevSectionRef.current === activeSection) return;
    prevSectionRef.current = activeSection;
    if (!hydrated || !canEdit) return;
    if (useBriefStore.getState().isDirty) {
      void runSave();
    }
  }, [activeSection, hydrated, canEdit, runSave]);

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

  return <>{children({ status, error, runSave })}</>;
}

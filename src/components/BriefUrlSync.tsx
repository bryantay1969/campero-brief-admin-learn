"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBriefStore } from "@/store/briefStore";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  briefSharePath,
  fetchCloudBriefById,
} from "@/lib/supabase/briefsApi";

/**
 * Keeps the browser URL in sync with the open brief and opens `?brief=<id>` links.
 * Respects `preferNewDraft` so “New empty brief” is not undone by the URL.
 */
function BriefUrlSyncInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefParam = searchParams.get("brief");

  const hydrated = useBriefStore((s) => s.hydrated);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const preferNewDraft = useBriefStore((s) => s.preferNewDraft);
  const openFromLibrary = useBriefStore((s) => s.openFromLibrary);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);

  const { cloudEnabled, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<string | null>(null);
  const openedParamRef = useRef<string | null>(null);
  const skipNextUrlWrite = useRef(false);

  // User started a new draft — strip ?brief= and never re-open from URL
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!preferNewDraft) return;

    openedParamRef.current = null;
    skipNextUrlWrite.current = true;
    if (briefParam) {
      router.replace("/", { scroll: false });
    }
  }, [preferNewDraft, briefParam, hydrated, authLoading, router]);

  // Open brief from ?brief=... (only when not in new-draft mode)
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (preferNewDraft) return;

    if (!briefParam) {
      openedParamRef.current = null;
      return;
    }
    if (openedParamRef.current === briefParam && activeBriefId === briefParam) {
      return;
    }
    if (activeBriefId === briefParam) {
      openedParamRef.current = briefParam;
      return;
    }

    if (openFromLibrary(briefParam)) {
      openedParamRef.current = briefParam;
      skipNextUrlWrite.current = true;
      setStatus(null);
      return;
    }

    if (!cloudEnabled) {
      setStatus(
        "That brief link was not found in this browser’s library. Sign in or open a shared cloud brief."
      );
      openedParamRef.current = briefParam;
      return;
    }

    let cancelled = false;
    setStatus("Opening brief…");
    void (async () => {
      try {
        // Re-check draft mode after await
        if (useBriefStore.getState().preferNewDraft) return;

        const rec = await fetchCloudBriefById(briefParam);
        if (cancelled) return;
        if (useBriefStore.getState().preferNewDraft) return;

        if (!rec) {
          setStatus(
            "Brief not found or you don’t have access. Check the link or ask an admin."
          );
          openedParamRef.current = briefParam;
          return;
        }
        applyCloudSave(rec);
        openedParamRef.current = briefParam;
        skipNextUrlWrite.current = true;
        setStatus(null);
      } catch (e) {
        if (cancelled) return;
        setStatus(
          e instanceof Error ? e.message : "Could not open brief from link"
        );
        openedParamRef.current = briefParam;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    briefParam,
    hydrated,
    authLoading,
    cloudEnabled,
    library,
    activeBriefId,
    preferNewDraft,
    openFromLibrary,
    applyCloudSave,
  ]);

  // Keep URL matching the open library brief (for easy sharing)
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (preferNewDraft) {
      // Stay on clean URL while drafting
      if (searchParams.get("brief")) {
        router.replace("/", { scroll: false });
      }
      return;
    }
    if (skipNextUrlWrite.current) {
      skipNextUrlWrite.current = false;
      return;
    }

    const current = searchParams.get("brief");
    if (activeBriefId) {
      if (current !== activeBriefId) {
        router.replace(briefSharePath(activeBriefId), { scroll: false });
      }
    } else if (current) {
      router.replace("/", { scroll: false });
    }
  }, [
    activeBriefId,
    hydrated,
    authLoading,
    router,
    searchParams,
    preferNewDraft,
  ]);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 max-w-md px-4">
      <div className="rounded-full bg-stone-900 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
        {status}
        <button
          type="button"
          className="ml-2 underline font-medium opacity-80 hover:opacity-100"
          onClick={() => setStatus(null)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function BriefUrlSync() {
  return (
    <Suspense fallback={null}>
      <BriefUrlSyncInner />
    </Suspense>
  );
}

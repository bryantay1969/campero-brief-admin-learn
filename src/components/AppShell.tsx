"use client";

import { useEffect } from "react";
import { useBriefStore, migrateLegacyDraft } from "@/store/briefStore";
import { FormNav } from "@/components/FormNav";
import { BrandGuidelinesPanel } from "@/components/BrandGuidelines";
import { SavedBriefsPanel } from "@/components/SavedBriefsPanel";
import { SaveControls } from "@/components/SaveControls";
import { PromoOverview } from "@/components/sections/PromoOverview";
import { MessagingCreative } from "@/components/sections/MessagingCreative";
import { DigitalAssets } from "@/components/sections/DigitalAssets";
import { ITElements } from "@/components/sections/ITElements";
import { PaidMedia } from "@/components/sections/PaidMedia";
import { PRSection } from "@/components/sections/PRSection";
import { PhysicalAssets } from "@/components/sections/PhysicalAssets";
import { LegalSection } from "@/components/sections/LegalSection";
import { ReviewGenerate } from "@/components/sections/ReviewGenerate";
import type { SectionId } from "@/lib/types";
import { SECTIONS } from "@/lib/brandGuidelines";
import { AuthBar } from "@/components/auth/AuthBar";
import { BriefUrlSync } from "@/components/BriefUrlSync";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileStack,
} from "lucide-react";

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "overview":
      return <PromoOverview />;
    case "messaging":
      return <MessagingCreative />;
    case "digital":
      return <DigitalAssets />;
    case "it":
      return <ITElements />;
    case "paid":
      return <PaidMedia />;
    case "pr":
      return <PRSection />;
    case "physical":
      return <PhysicalAssets />;
    case "legal":
      return <LegalSection />;
    case "review":
      return <ReviewGenerate />;
    default:
      return null;
  }
}

export function AppShell() {
  const activeSection = useBriefStore((s) => s.activeSection);
  const setActiveSection = useBriefStore((s) => s.setActiveSection);
  const loadSample = useBriefStore((s) => s.loadSample);
  const clearForm = useBriefStore((s) => s.clearForm);
  const hydrated = useBriefStore((s) => s.hydrated);
  const isDirty = useBriefStore((s) => s.isDirty);
  const { isViewer, canEdit } = useAuth();

  useEffect(() => {
    // Always unlock the UI. Persist rehydration is best-effort; never block tabs.
    const markReady = () => {
      try {
        migrateLegacyDraft();
      } catch {
        // ignore migration errors
      }
      useBriefStore.setState({ hydrated: true });
    };

    markReady();
    const unsub = useBriefStore.persist.onFinishHydration(markReady);
    if (useBriefStore.persist.hasHydrated()) {
      markReady();
    }
    // Extra safety if rehydrate is delayed
    const fallback = window.setTimeout(markReady, 100);

    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  // Warn before leaving with unsaved library changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;

  const handleClear = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Clear the form and start a blank brief? Your working draft will be replaced. Saved library briefs are not deleted."
      )
    ) {
      clearForm();
    }
  };

  const handleLoadSample = () => {
    if (isDirty) {
      const ok = window.confirm(
        "Load the sample brief? Unsaved changes on the current form will be replaced. Saved library briefs are not deleted."
      );
      if (!ok) return;
    }
    loadSample();
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-stone-900">
      <BriefUrlSync />
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D04] to-[#FFBA08] text-white font-black text-sm shadow-md shadow-orange-200">
              PC
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                Campero Promo Brief Builder
              </h1>
              <p className="text-xs text-stone-500">
                Shared library · login required
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveControls />
            <AuthBar />
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-campero-orange/40 hover:bg-orange-50"
            >
              <FileStack className="h-3.5 w-3.5" />
              Load sample
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear form
            </button>
          </div>
        </div>
      </header>

      <FormNav />

      {isViewer && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 text-sm text-amber-900">
            <strong>View only:</strong> you can open briefs and export PDF, but
            you cannot save changes to the shared library. Ask an admin for{" "}
            <strong>editor</strong> access if you need to edit.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Always show the form; draft rehydration must never block the UI */}
        <SectionBody id={activeSection} />

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && setActiveSection(prev.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            {prev ? prev.shortLabel : "Back"}
          </button>
          {next ? (
            <button
              type="button"
              onClick={() => setActiveSection(next.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-campero-orange px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-campero-orange-dark"
            >
              {next.shortLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-xs text-stone-400">
              Generate your brief above
            </span>
          )}
        </div>
        {!hydrated && (
          <p className="mt-3 text-center text-xs text-stone-400">
            Restoring saved draft…
          </p>
        )}
      </main>

      <footer className="border-t border-orange-100 bg-white py-6 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-xs text-stone-400">
          Campero Promo Brief Builder · Shared library via Supabase ·{" "}
          {canEdit
            ? "Editors and admins can save"
            : "Viewers can browse and export only"}
        </div>
      </footer>

      <BrandGuidelinesPanel />
      <SavedBriefsPanel />
    </div>
  );
}

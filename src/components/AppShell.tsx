"use client";

import { useEffect, useState } from "react";
import { useBriefStore, migrateLegacyDraft } from "@/store/briefStore";
import { BrandGuidelinesPanel } from "@/components/BrandGuidelines";
import { SavedBriefsPanel } from "@/components/SavedBriefsPanel";
import { SectionSaveEngine } from "@/components/SectionSaveEngine";
import { LeftToolbar } from "@/components/LeftToolbar";
import { FormNav } from "@/components/FormNav";
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
import { BriefUrlSync } from "@/components/BriefUrlSync";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  PanelLeft,
  X,
} from "lucide-react";

const SIDEBAR_KEY = "campero-left-toolbar-open";

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
  const hydrated = useBriefStore((s) => s.hydrated);
  const isDirty = useBriefStore((s) => s.isDirty);
  const brief = useBriefStore((s) => s.brief);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const formInstanceId = useBriefStore((s) => s.formInstanceId);
  const { isViewer, canEdit } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw === "0") setSidebarOpen(false);
      if (raw === "1") setSidebarOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const setSidebar = (open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
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
    const fallback = window.setTimeout(markReady, 100);

    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeSection]);

  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;

  const activeName =
    library.find((b) => b.id === activeBriefId)?.name ||
    brief.promoName.trim() ||
    "Untitled draft";

  return (
    <SectionSaveEngine>
      {({ status, error, runSave }) => (
        <div className="min-h-screen bg-[#FFFBF7] text-stone-900">
          <BriefUrlSync />

          <div className="flex min-h-screen">
            {/* Desktop left toolbar (toggleable) */}
            {sidebarOpen && (
              <div className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 sticky top-0 h-screen">
                <LeftToolbar
                  saveStatus={status}
                  saveError={error}
                  onSave={runSave}
                  onHide={() => setSidebar(false)}
                />
              </div>
            )}

            {/* Mobile drawer */}
            {mobileNavOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Close menu"
                  onClick={() => setMobileNavOpen(false)}
                />
                <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] shadow-xl">
                  <LeftToolbar
                    saveStatus={status}
                    saveError={error}
                    onSave={runSave}
                    onHide={() => setMobileNavOpen(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="absolute top-3 right-3 rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur-md">
                <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  {/* Mobile: open drawer */}
                  <button
                    type="button"
                    className="lg:hidden inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-700"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  {/* Desktop: show toolbar if hidden */}
                  {!sidebarOpen && (
                    <button
                      type="button"
                      className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      onClick={() => setSidebar(true)}
                      title="Show left toolbar"
                    >
                      <PanelLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Menu</span>
                    </button>
                  )}
                  {/* Desktop: hide when open (also in sidebar) */}
                  {sidebarOpen && (
                    <button
                      type="button"
                      className="hidden lg:inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50"
                      onClick={() => setSidebar(false)}
                      title="Hide left toolbar"
                      aria-label="Hide left toolbar"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-campero-orange">
                      Campero Promo Brief
                    </p>
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {activeName}
                    </p>
                  </div>
                </div>
              </header>

              {/* Sections restored above the brief */}
              <FormNav />

              {isViewer && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 sm:px-6 py-2 text-sm text-amber-900">
                  <strong>View only:</strong> you can open briefs and export
                  PDF, but you cannot save changes. Ask an admin for{" "}
                  <strong>editor</strong> access if you need to edit.
                </div>
              )}

              <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-4xl w-full mx-auto">
                <SectionBody key={formInstanceId} id={activeSection} />

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
                      title={`Continue to ${next.shortLabel}`}
                    >
                      Save and Continue
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400">
                      Review complete
                    </span>
                  )}
                </div>
                {!hydrated && (
                  <p className="mt-3 text-center text-xs text-stone-400">
                    Restoring saved draft…
                  </p>
                )}
              </main>

              <footer className="border-t border-orange-100 bg-white py-4 mt-auto">
                <div className="px-4 sm:px-6 text-center text-xs text-stone-400">
                  Campero Promo Brief Builder ·{" "}
                  {canEdit
                    ? "Saves when you change section tabs"
                    : "Viewers can browse and export only"}
                </div>
              </footer>
            </div>
          </div>

          <BrandGuidelinesPanel />
          <SavedBriefsPanel />
        </div>
      )}
    </SectionSaveEngine>
  );
}

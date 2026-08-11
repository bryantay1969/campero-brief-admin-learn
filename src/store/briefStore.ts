"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PhotoAssetReference,
  PromoBrief,
  SavedBriefRecord,
  SectionId,
} from "@/lib/types";
import {
  createEmptyBrief,
  createSampleBrief,
  normalizePhysicalAssets,
} from "@/lib/defaults";
import { defaultBriefName, newBriefId } from "@/lib/briefIds";
import { normalizeDigitalAssets } from "@/lib/digitalAssets";
import { normalizeITElements } from "@/lib/itElements";
import { normalizePaidMedia } from "@/lib/paidMedia";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Migrate legacy string photo refs → name/link pairs. */
function normalizePhotoRefs(value: unknown): PhotoAssetReference[] {
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const r = item as Partial<PhotoAssetReference>;
        return {
          id: r.id || uid(),
          name: typeof r.name === "string" ? r.name : "",
          link: typeof r.link === "string" ? r.link : "",
        };
      });
    return items.length > 0 ? items : [{ id: uid(), name: "", link: "" }];
  }
  if (typeof value === "string" && value.trim()) {
    // Split legacy "file1; file2" strings into name-only rows
    const parts = value
      .split(/[;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return [{ id: uid(), name: "", link: "" }];
    }
    return parts.map((name) => ({ id: uid(), name, link: "" }));
  }
  return [{ id: uid(), name: "", link: "" }];
}

function normalizeBrief(brief: PromoBrief | null | undefined): PromoBrief {
  try {
    if (!brief || typeof brief !== "object") {
      return createEmptyBrief();
    }
    return {
      ...createEmptyBrief(),
      ...brief,
      digitalAssets: normalizeDigitalAssets(
        (brief as PromoBrief).digitalAssets
      ),
      itElements: normalizeITElements(
        (brief as { itElements?: unknown }).itElements
      ),
      paidMedia: normalizePaidMedia(
        (brief as { paidMedia?: unknown }).paidMedia
      ),
      messagingBullets: Array.isArray(brief.messagingBullets)
        ? brief.messagingBullets
        : createEmptyBrief().messagingBullets,
      foodPhotoReferences: normalizePhotoRefs(
        (brief as { foodPhotoReferences?: unknown }).foodPhotoReferences
      ),
      physicalAssets: normalizePhysicalAssets(
        (brief as { physicalAssets?: unknown }).physicalAssets
      ),
      legal: brief.legal || createEmptyBrief().legal,
    };
  } catch {
    return createEmptyBrief();
  }
}

function normalizeLibrary(
  library: SavedBriefRecord[] | null | undefined
): SavedBriefRecord[] {
  if (!Array.isArray(library)) return [];
  return library
    .filter((rec) => rec && typeof rec === "object" && rec.id)
    .map((rec) => ({
      ...rec,
      name: rec.name || "Untitled brief",
      createdAt: rec.createdAt || new Date().toISOString(),
      updatedAt: rec.updatedAt || new Date().toISOString(),
      brief: normalizeBrief(rec.brief),
    }));
}

interface BriefState {
  brief: PromoBrief;
  /** Library of named briefs saved for later revisit. */
  library: SavedBriefRecord[];
  /** Currently open library entry, or null if working on an unsaved draft. */
  activeBriefId: string | null;
  /** True when form differs from last explicit library save (or never saved). */
  isDirty: boolean;

  activeSection: SectionId;
  showGuidelines: boolean;
  showPreview: boolean;
  showLibrary: boolean;
  hydrated: boolean;

  setActiveSection: (id: SectionId) => void;
  setShowGuidelines: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setShowLibrary: (show: boolean) => void;
  setHydrated: (v: boolean) => void;

  updateBrief: (partial: Partial<PromoBrief>) => void;
  setBrief: (brief: PromoBrief) => void;
  patch: <K extends keyof PromoBrief>(key: K, value: PromoBrief[K]) => void;

  loadSample: () => void;
  clearForm: () => void;
  newBrief: () => void;

  /** Save current form into the library (update active, or create new). */
  saveToLibrary: (name?: string) => SavedBriefRecord;
  /** Always create a new library entry from the current form. */
  saveAsNew: (name: string) => SavedBriefRecord;
  openFromLibrary: (id: string) => boolean;
  deleteFromLibrary: (id: string) => void;
  renameInLibrary: (id: string, name: string) => void;
  duplicateInLibrary: (id: string) => SavedBriefRecord | null;
  importIntoLibrary: (record: {
    name?: string;
    brief: PromoBrief;
  }) => SavedBriefRecord;

  /** Replace library from Supabase cloud list. */
  setCloudLibrary: (records: SavedBriefRecord[]) => void;
  /** Apply a cloud-saved record as active library entry. */
  applyCloudSave: (record: SavedBriefRecord) => void;
}

function stampBrief(brief: PromoBrief): PromoBrief {
  return {
    ...normalizeBrief(brief),
    lastSaved: new Date().toISOString(),
  };
}

function sortLibrary(library: SavedBriefRecord[]): SavedBriefRecord[] {
  return [...library].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export const useBriefStore = create<BriefState>()(
  persist(
    (set, get) => ({
      brief: createEmptyBrief(),
      library: [],
      activeBriefId: null,
      isDirty: false,
      activeSection: "overview",
      showGuidelines: false,
      showPreview: false,
      showLibrary: false,
      hydrated: false,

      setActiveSection: (id) => set({ activeSection: id }),
      setShowGuidelines: (show) => set({ showGuidelines: show }),
      setShowPreview: (show) => set({ showPreview: show }),
      setShowLibrary: (show) => set({ showLibrary: show }),
      setHydrated: (v) => set({ hydrated: v }),

      updateBrief: (partial) =>
        set({
          brief: stampBrief({ ...get().brief, ...partial }),
          isDirty: true,
        }),

      setBrief: (brief) =>
        set({
          brief: stampBrief(brief),
          isDirty: true,
        }),

      patch: (key, value) =>
        set({
          brief: stampBrief({ ...get().brief, [key]: value }),
          isDirty: true,
        }),

      loadSample: () =>
        set({
          brief: createSampleBrief(),
          activeBriefId: null,
          isDirty: true,
          activeSection: "overview",
          showPreview: false,
        }),

      clearForm: () =>
        set({
          brief: createEmptyBrief(),
          activeBriefId: null,
          isDirty: true,
          activeSection: "overview",
          showPreview: false,
        }),

      newBrief: () =>
        set({
          brief: createEmptyBrief(),
          activeBriefId: null,
          isDirty: false,
          activeSection: "overview",
          showPreview: false,
          showLibrary: false,
          showGuidelines: false,
        }),

      saveToLibrary: (name) => {
        const state = get();
        const now = new Date().toISOString();
        const brief = stampBrief(state.brief);
        const resolvedName =
          (name && name.trim()) ||
          (state.activeBriefId
            ? state.library.find((b) => b.id === state.activeBriefId)?.name
            : undefined) ||
          defaultBriefName(brief.promoName, brief.projectLead);

        if (state.activeBriefId) {
          const existing = state.library.find(
            (b) => b.id === state.activeBriefId
          );
          if (existing) {
            const updated: SavedBriefRecord = {
              ...existing,
              name: resolvedName,
              updatedAt: now,
              brief,
            };
            set({
              brief,
              library: sortLibrary(
                state.library.map((b) =>
                  b.id === existing.id ? updated : b
                )
              ),
              isDirty: false,
            });
            return updated;
          }
        }

        const created: SavedBriefRecord = {
          id: newBriefId(),
          name: resolvedName,
          createdAt: now,
          updatedAt: now,
          brief,
        };
        set({
          brief,
          library: sortLibrary([created, ...state.library]),
          activeBriefId: created.id,
          isDirty: false,
        });
        return created;
      },

      saveAsNew: (name) => {
        const state = get();
        const now = new Date().toISOString();
        const brief = stampBrief(state.brief);
        const created: SavedBriefRecord = {
          id: newBriefId(),
          name:
            name.trim() ||
            defaultBriefName(brief.promoName, brief.projectLead),
          createdAt: now,
          updatedAt: now,
          brief,
        };
        set({
          brief,
          library: sortLibrary([created, ...state.library]),
          activeBriefId: created.id,
          isDirty: false,
        });
        return created;
      },

      openFromLibrary: (id) => {
        const record = get().library.find((b) => b.id === id);
        if (!record) return false;
        const brief = normalizeBrief(record.brief);
        set({
          brief,
          // Keep library entry on current schema when opened
          library: get().library.map((b) =>
            b.id === id ? { ...b, brief } : b
          ),
          activeBriefId: record.id,
          isDirty: false,
          activeSection: "overview",
          showPreview: false,
          showLibrary: false,
        });
        return true;
      },

      deleteFromLibrary: (id) => {
        const state = get();
        set({
          library: state.library.filter((b) => b.id !== id),
          activeBriefId:
            state.activeBriefId === id ? null : state.activeBriefId,
          // If we deleted the open brief, keep form content but treat as unsaved draft
          isDirty: state.activeBriefId === id ? true : state.isDirty,
        });
      },

      renameInLibrary: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({
          library: sortLibrary(
            get().library.map((b) =>
              b.id === id
                ? { ...b, name: trimmed, updatedAt: new Date().toISOString() }
                : b
            )
          ),
        });
      },

      duplicateInLibrary: (id) => {
        const source = get().library.find((b) => b.id === id);
        if (!source) return null;
        const now = new Date().toISOString();
        const copy: SavedBriefRecord = {
          id: newBriefId(),
          name: `${source.name} (copy)`,
          createdAt: now,
          updatedAt: now,
          brief: stampBrief({ ...source.brief }),
        };
        set({
          library: sortLibrary([copy, ...get().library]),
        });
        return copy;
      },

      importIntoLibrary: ({ name, brief }) => {
        const now = new Date().toISOString();
        const stamped = stampBrief(brief);
        const created: SavedBriefRecord = {
          id: newBriefId(),
          name:
            (name && name.trim()) ||
            defaultBriefName(stamped.promoName, stamped.projectLead),
          createdAt: now,
          updatedAt: now,
          brief: stamped,
        };
        set({
          library: sortLibrary([created, ...get().library]),
          brief: stamped,
          activeBriefId: created.id,
          isDirty: false,
          activeSection: "overview",
          showPreview: false,
          showLibrary: false,
        });
        return created;
      },

      setCloudLibrary: (records) => {
        set({
          library: sortLibrary(
            records.map((r) => ({
              ...r,
              brief: normalizeBrief(r.brief),
            }))
          ),
        });
      },

      applyCloudSave: (record) => {
        const stamped = stampBrief(record.brief);
        const next: SavedBriefRecord = {
          ...record,
          brief: stamped,
        };
        const state = get();
        const exists = state.library.some((b) => b.id === next.id);
        set({
          brief: stamped,
          activeBriefId: next.id,
          isDirty: false,
          library: sortLibrary(
            exists
              ? state.library.map((b) => (b.id === next.id ? next : b))
              : [next, ...state.library]
          ),
        });
      },
    }),
    {
      name: "campero-promo-brief-store",
      partialize: (state) => ({
        brief: state.brief,
        library: state.library,
        activeBriefId: state.activeBriefId,
        isDirty: state.isDirty,
        activeSection: state.activeSection,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Defer setState — calling useBriefStore during create() causes
        // "Cannot access before initialization"
        if (error) {
          console.warn("Brief store rehydration failed:", error);
        }
        queueMicrotask(() => {
          try {
            if (state) {
              useBriefStore.setState({
                brief: normalizeBrief(state.brief),
                library: normalizeLibrary(state.library),
                hydrated: true,
              });
            } else {
              useBriefStore.setState({ hydrated: true });
            }
          } catch (e) {
            console.warn("Brief store post-rehydrate normalize failed:", e);
            try {
              useBriefStore.setState({ hydrated: true });
            } catch {
              /* ignore */
            }
          }
        });
      },
      merge: (persisted, current) => {
        try {
          const p = (persisted || {}) as Partial<BriefState>;
          return {
            ...current,
            brief: p.brief ? normalizeBrief(p.brief) : current.brief,
            library:
              p.library !== undefined
                ? normalizeLibrary(p.library)
                : current.library,
            activeBriefId:
              typeof p.activeBriefId === "string" || p.activeBriefId === null
                ? (p.activeBriefId ?? null)
                : current.activeBriefId,
            isDirty: typeof p.isDirty === "boolean" ? p.isDirty : true,
            activeSection: p.activeSection || current.activeSection,
            // merge already normalizes; AppShell / onRehydrate marks ready
            hydrated: false,
          };
        } catch (e) {
          console.warn("Brief store merge failed, using defaults:", e);
          return { ...current, hydrated: false };
        }
      },
    }
  )
);

/** One-time migration from the old draft-only localStorage key. */
export function migrateLegacyDraft(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem("campero-promo-brief-draft");
    if (!legacy) return;
    const parsed = JSON.parse(legacy) as {
      state?: { brief?: PromoBrief; activeSection?: SectionId };
    };
    const store = useBriefStore.getState();
    // Only adopt legacy draft if library is empty and we still have sample-like empty library
    if (parsed.state?.brief && store.library.length === 0) {
      useBriefStore.setState({
        brief: normalizeBrief(parsed.state.brief),
        activeSection: parsed.state.activeSection || "overview",
        activeBriefId: null,
        isDirty: true,
      });
    }
    // Keep legacy key as backup; do not delete automatically
  } catch {
    // ignore corrupt legacy data
  }
}

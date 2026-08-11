import type { ITAssetItem, ITElements, LegacyITElements } from "./types";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createITAsset(
  partial: Partial<ITAssetItem> & { title: string }
): ITAssetItem {
  return {
    id: partial.id || uid(),
    title: partial.title,
    specs: partial.specs ?? "",
    enabled: partial.enabled ?? false,
    notes: partial.notes ?? "",
    priority: partial.priority ?? "",
    linkLabel: partial.linkLabel ?? "",
    linkHref: partial.linkHref ?? "",
    notesPlaceholder: partial.notesPlaceholder ?? "",
  };
}

/** Global IT catalog definition (shared for all briefs). */
export type ITCatalogDef = {
  id: string;
  slug: string;
  title: string;
  /** Subtitle under the name */
  specs: string;
  /** Pre-filled description on new / reset assets */
  notesDefault: string;
  /** Hint shown when description is empty */
  notesPlaceholder: string;
  priorityDefault?: string;
  linkLabel?: string;
  linkHref?: string;
  dbId?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const OLO_KOALA_DESCRIPTION = `Static Product Image
• OLO: 900 x 600px PNG image(s)
• Koala: 2000 x 2000px PNG image(s)`;

const OLO_DESCRIPTION_TEMPLATE = `• Category: Under XXX
• Title:
• Description:`;

/** Offline / seed catalog matching historical built-ins. */
export const BUILTIN_IT_CATALOG: ITCatalogDef[] = [
  {
    id: "oloKoalaImage",
    slug: "oloKoalaImage",
    title: "OLO / Koala Image",
    specs: "Static Product Images",
    notesDefault: OLO_KOALA_DESCRIPTION,
    notesPlaceholder: "Specs, sizes, or other image details…",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "oloDescription",
    slug: "oloDescription",
    title: "OLO Description",
    specs: "Category, Title, and Description for online ordering",
    notesDefault: OLO_DESCRIPTION_TEMPLATE,
    notesPlaceholder: "Category, title, description for OLO…",
    sortOrder: 20,
    isActive: true,
  },
  {
    id: "ezCaterImage",
    slug: "ezCaterImage",
    title: "EZ Cater Image",
    specs: "Static Product Image - 1200 x 800px PNG image(s)",
    notesDefault: "",
    notesPlaceholder: "Specs, copy, timing, or other details…",
    sortOrder: 30,
    isActive: true,
  },
];

export const BUILT_IN_IT_ASSET_IDS = new Set(
  BUILTIN_IT_CATALOG.map((c) => c.slug)
);

/** Built-in or catalog-managed assets use global title/subtitle from catalog. */
export function isCatalogITAsset(
  asset: ITAssetItem,
  catalog: ITCatalogDef[]
): boolean {
  return catalog.some((c) => c.slug === asset.id || c.id === asset.id);
}

export function isCustomITAsset(
  asset: ITAssetItem,
  catalog?: ITCatalogDef[]
): boolean {
  if (catalog && catalog.length > 0) {
    return !isCatalogITAsset(asset, catalog);
  }
  return !BUILT_IN_IT_ASSET_IDS.has(asset.id);
}

/** Fixed note shown below the IT asset list (not a checklist item). */
export const IT_PROJECT_OWNER_NOTE =
  "Note for project owner: If this is not food item (st. Jude cup) need to alert IT to add item to be sold on in-store kiosk.";

export function createITElementsFromCatalog(
  catalog: ITCatalogDef[]
): ITElements {
  return catalog.map((c) =>
    createITAsset({
      id: c.slug,
      title: c.title,
      specs: c.specs,
      notes: c.notesDefault,
      enabled: false,
      priority: c.priorityDefault || "",
      linkLabel: c.linkLabel || "",
      linkHref: c.linkHref || "",
    })
  );
}

export function createDefaultITElements(): ITElements {
  return createITElementsFromCatalog(BUILTIN_IT_CATALOG);
}

/**
 * Merge global catalog into a brief’s IT list.
 * - Catalog items appear in catalog order (title/subtitle from catalog).
 * - Brief keeps enabled + notes for known slugs.
 * - New catalog items are added with pre-filled notes.
 * - Brief-only custom rows stay after catalog items.
 */
export function mergeITElementsWithCatalog(
  briefAssets: ITElements,
  catalog: ITCatalogDef[]
): ITElements {
  const byId = new Map(
    briefAssets
      .filter((a) => a && a.id)
      .map((a) => [a.id, createITAsset({ ...a, title: a.title || "" })])
  );

  const catalogSlugs = new Set(catalog.map((c) => c.slug));
  const merged: ITElements = catalog.map((c) => {
    const existing = byId.get(c.slug);
    if (existing) {
      return createITAsset({
        ...existing,
        id: c.slug,
        title: c.title,
        specs: c.specs,
        // Keep brief notes; only fill empty from catalog default
        notes: existing.notes.trim() ? existing.notes : c.notesDefault,
        enabled: existing.enabled,
        priority:
          (existing.priority || "").trim() || c.priorityDefault || "",
        linkLabel: c.linkLabel || "",
        linkHref: c.linkHref || "",
      });
    }
    return createITAsset({
      id: c.slug,
      title: c.title,
      specs: c.specs,
      notes: c.notesDefault,
      enabled: false,
      priority: c.priorityDefault || "",
      linkLabel: c.linkLabel || "",
      linkHref: c.linkHref || "",
    });
  });

  const custom = briefAssets.filter(
    (a) => a && a.id && a.id !== "nonFoodItAlert" && !catalogSlugs.has(a.id)
  );

  return [...merged, ...custom.map((a) => createITAsset({ ...a, title: a.title || "" }))];
}

export function formatITAssetDetail(asset: ITAssetItem): string {
  const parts: string[] = [];
  if (asset.specs.trim()) parts.push(asset.specs.trim());
  if (asset.notes.trim()) parts.push(asset.notes.trim());
  return parts.join(" · ");
}

function isNewShape(value: unknown): value is ITElements {
  return Array.isArray(value);
}

function isLegacyShape(value: unknown): value is LegacyITElements {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "oloKoalaImage" in value
  );
}

export function migrateLegacyITElements(legacy: LegacyITElements): ITElements {
  try {
    const base = createDefaultITElements();
    const byId = Object.fromEntries(base.map((a) => [a.id, a]));

    if (legacy.oloKoalaImage) {
      byId.oloKoalaImage = {
        ...byId.oloKoalaImage,
        enabled: !!legacy.oloKoalaImage.enabled,
        notes: legacy.oloKoalaImage.notes?.trim() || OLO_KOALA_DESCRIPTION,
      };
    }

    if (legacy.oloDescription) {
      const parts = [
        legacy.oloDescription.category &&
          `Category: ${legacy.oloDescription.category}`,
        legacy.oloDescription.title && `Title: ${legacy.oloDescription.title}`,
        legacy.oloDescription.description,
        legacy.oloDescription.notes,
      ].filter(Boolean) as string[];
      const combined = parts.join(" · ").trim();
      byId.oloDescription = {
        ...byId.oloDescription,
        enabled: !!legacy.oloDescription.enabled,
        notes: combined || OLO_DESCRIPTION_TEMPLATE,
      };
    }

    if (legacy.ezCaterImage) {
      byId.ezCaterImage = {
        ...byId.ezCaterImage,
        enabled: !!legacy.ezCaterImage.enabled,
        notes: legacy.ezCaterImage.notes || "",
      };
    }

    return Object.values(byId);
  } catch {
    return createDefaultITElements();
  }
}

export function normalizeITElements(value: unknown): ITElements {
  try {
    if (isNewShape(value)) {
      return value
        .filter((item) => item && typeof item === "object")
        .filter((item) => item.id !== "nonFoodItAlert")
        .map((item) => {
          const existingNotes = (item.notes || "").trim();
          let notes = item.notes || "";
          // One-time legacy note upgrades for old briefs
          if (item.id === "oloKoalaImage") {
            const isLegacyOloNote =
              !existingNotes ||
              existingNotes ===
                "OLO creative not required for email/organic-only scope." ||
              existingNotes === "900×600 PNG / 2000×2000 PNG";
            if (isLegacyOloNote) notes = OLO_KOALA_DESCRIPTION;
          }
          if (item.id === "oloDescription" && !existingNotes) {
            notes = OLO_DESCRIPTION_TEMPLATE;
          }

          return createITAsset({
            ...item,
            title: item.title || "Untitled asset",
            // Prefer stored subtitle (allows global/admin edits to persist on brief)
            specs: (item.specs && item.specs.trim()) || "",
            notes,
          });
        });
    }
    if (isLegacyShape(value)) {
      return migrateLegacyITElements(value);
    }
    return createDefaultITElements();
  } catch {
    return createDefaultITElements();
  }
}

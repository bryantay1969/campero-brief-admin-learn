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
  };
}

export const BUILT_IN_IT_ASSET_IDS = new Set([
  "oloKoalaImage",
  "oloDescription",
  "ezCaterImage",
]);

export function isCustomITAsset(asset: ITAssetItem): boolean {
  return !BUILT_IN_IT_ASSET_IDS.has(asset.id);
}

/** Fixed note shown below the IT asset list (not a checklist item). */
export const IT_PROJECT_OWNER_NOTE =
  "Note for project owner: If this is not food item (st. Jude cup) need to alert IT to add item to be sold on in-store kiosk.";

const DEFAULT_SPECS: Record<string, string> = {
  oloKoalaImage: "Static Product Images",
  oloDescription: "Category, Title, and Description for online ordering",
  ezCaterImage: "Static Product Image - 1200 x 800px PNG image(s)",
};

const OLO_KOALA_DESCRIPTION = `Static Product Image
• OLO: 900 x 600px PNG image(s)
• Koala: 2000 x 2000px PNG image(s)`;

const OLO_DESCRIPTION_TEMPLATE = `• Category: Under XXX
• Title:
• Description:`;

export function createDefaultITElements(): ITElements {
  return [
    createITAsset({
      id: "oloKoalaImage",
      title: "OLO / Koala Image",
      specs: DEFAULT_SPECS.oloKoalaImage,
      notes: OLO_KOALA_DESCRIPTION,
    }),
    createITAsset({
      id: "oloDescription",
      title: "OLO Description",
      specs: DEFAULT_SPECS.oloDescription,
      notes: OLO_DESCRIPTION_TEMPLATE,
    }),
    createITAsset({
      id: "ezCaterImage",
      title: "EZ Cater Image",
      specs: DEFAULT_SPECS.ezCaterImage,
    }),
  ];
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
        specs: DEFAULT_SPECS.oloKoalaImage,
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
        specs: DEFAULT_SPECS.oloDescription,
      };
    }

    if (legacy.ezCaterImage) {
      byId.ezCaterImage = {
        ...byId.ezCaterImage,
        enabled: !!legacy.ezCaterImage.enabled,
        notes: legacy.ezCaterImage.notes || "",
        specs: DEFAULT_SPECS.ezCaterImage,
      };
    }

    // nonFoodItAlert removed from list — project owner note is UI-only
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
        // Drop removed built-in non-food kiosk row
        .filter((item) => item.id !== "nonFoodItAlert")
        .map((item) => {
          const defaultSpecs = item.id ? DEFAULT_SPECS[item.id] : undefined;
          const existingNotes = (item.notes || "").trim();

          let notes = item.notes || "";
          if (item.id === "oloKoalaImage") {
            const isLegacyOloNote =
              !existingNotes ||
              existingNotes ===
                "OLO creative not required for email/organic-only scope." ||
              existingNotes === "900×600 PNG / 2000×2000 PNG";
            if (isLegacyOloNote) notes = OLO_KOALA_DESCRIPTION;
          }
          if (item.id === "oloDescription") {
            if (!existingNotes) notes = OLO_DESCRIPTION_TEMPLATE;
          }

          return createITAsset({
            ...item,
            title: item.title || "Untitled asset",
            specs:
              item.id && DEFAULT_SPECS[item.id]
                ? DEFAULT_SPECS[item.id]
                : (item.specs && item.specs.trim()) || defaultSpecs || "",
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

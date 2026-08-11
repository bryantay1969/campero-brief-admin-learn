import type {
  LegacyPaidMedia,
  PaidMedia,
  PaidMediaAssetItem,
} from "./types";
import type { FormAssetCatalogDef } from "./formAssetCatalog";
import { mergeListWithCatalog } from "./formAssetCatalog";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPaidMediaAsset(
  partial: Partial<PaidMediaAssetItem> & { title: string }
): PaidMediaAssetItem {
  return {
    id: partial.id || uid(),
    title: partial.title,
    specs: partial.specs ?? "",
    enabled: partial.enabled ?? false,
    notes: partial.notes ?? "",
    priority: partial.priority ?? "",
    linkLabel: partial.linkLabel ?? "",
    linkHref: partial.linkHref ?? "",
  };
}

export const BUILT_IN_PAID_MEDIA_IDS = new Set([
  "metaPaidSocial",
  "pmaxGoogle",
  "tiktok",
  "olvYoutube",
]);

export function isCustomPaidMediaAsset(
  asset: PaidMediaAssetItem,
  catalogSlugs?: Set<string>
): boolean {
  if (catalogSlugs && catalogSlugs.size > 0) {
    return !catalogSlugs.has(asset.id);
  }
  return !BUILT_IN_PAID_MEDIA_IDS.has(asset.id);
}

export function mergePaidWithCatalog(
  briefAssets: PaidMedia,
  catalog: FormAssetCatalogDef[]
): PaidMedia {
  return mergeListWithCatalog(briefAssets, catalog, (p) =>
    createPaidMediaAsset({
      id: p.id,
      title: p.title,
      specs: p.specs,
      notes: p.notes,
      enabled: p.enabled,
      priority: p.priority || "",
      linkLabel: p.linkLabel || "",
      linkHref: p.linkHref || "",
    })
  );
}

export const PAID_MEDIA_SPEC_SHEET = {
  label: "Pollo Campero Spec and Timing Sheet 2026",
  href: "https://truth.app.box.com/s/3gol4d1i8j1h2prgarozfxdvgjb7sa24",
} as const;

const TRU_PRIORITY = "Due to Tru 1 week early";

const DEFAULT_SPECS: Record<string, string> = {
  metaPaidSocial:
    "1080×1080 / 1080×1920, Animated (unless noted otherwise)",
  pmaxGoogle:
    "1200x1200; 1200x628, Optional 960x1200 - Animated (unless noted otherwise)",
  tiktok: "Primary text ≤100 characters",
  olvYoutube: "",
};

const DEFAULT_PRIORITY: Record<string, string> = {
  metaPaidSocial: TRU_PRIORITY,
  pmaxGoogle: TRU_PRIORITY,
};

const META_DESCRIPTION = `• Headline: 27 characters (including spaces)
• Primary text/body: 125 characters (including spaces)`;

const TIKTOK_DESCRIPTION = "Primary Text: 100 Characters";

const OLV_DESCRIPTION = `3 Short headlines:
• 30 characters max: • 30 characters max: • 15 characters max

1 Long headline:
• 90 characters max:

2 Description:
• 90 characters max: • 60 characters max

1 CTA`;

const DEFAULT_NOTES: Record<string, string> = {
  metaPaidSocial: META_DESCRIPTION,
  tiktok: TIKTOK_DESCRIPTION,
  olvYoutube: OLV_DESCRIPTION,
};

export function createDefaultPaidMedia(): PaidMedia {
  return [
    createPaidMediaAsset({
      id: "metaPaidSocial",
      title: "Meta Paid Social",
      specs: DEFAULT_SPECS.metaPaidSocial,
      priority: DEFAULT_PRIORITY.metaPaidSocial,
      notes: DEFAULT_NOTES.metaPaidSocial,
    }),
    createPaidMediaAsset({
      id: "pmaxGoogle",
      title: "PMAX / Google",
      specs: DEFAULT_SPECS.pmaxGoogle,
      priority: DEFAULT_PRIORITY.pmaxGoogle,
    }),
    createPaidMediaAsset({
      id: "tiktok",
      title: "TikTok Paid Media",
      specs: DEFAULT_SPECS.tiktok,
      notes: DEFAULT_NOTES.tiktok,
    }),
    createPaidMediaAsset({
      id: "olvYoutube",
      title: "OLV / YouTube",
      specs: DEFAULT_SPECS.olvYoutube,
      notes: DEFAULT_NOTES.olvYoutube,
    }),
  ];
}

export function formatPaidMediaDetail(asset: PaidMediaAssetItem): string {
  const parts: string[] = [];
  if (asset.specs.trim()) parts.push(asset.specs.trim());
  if (asset.priority?.trim()) parts.push(asset.priority.trim());
  if (asset.notes.trim()) parts.push(asset.notes.trim());
  return parts.join(" · ");
}

function isNewShape(value: unknown): value is PaidMedia {
  return Array.isArray(value);
}

function isLegacyShape(value: unknown): value is LegacyPaidMedia {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "metaPaidSocial" in value
  );
}

export function migrateLegacyPaidMedia(legacy: LegacyPaidMedia): PaidMedia {
  try {
    const base = createDefaultPaidMedia();
    const byId = Object.fromEntries(base.map((a) => [a.id, a]));

    if (legacy.metaPaidSocial) {
      const parts = [
        legacy.metaPaidSocial.headline &&
          `Headline: ${legacy.metaPaidSocial.headline}`,
        legacy.metaPaidSocial.primaryText &&
          `Primary: ${legacy.metaPaidSocial.primaryText}`,
        legacy.metaPaidSocial.notes,
      ].filter(Boolean) as string[];
      byId.metaPaidSocial = {
        ...byId.metaPaidSocial,
        enabled: !!legacy.metaPaidSocial.enabled,
        notes: parts.join(" · ").trim() || META_DESCRIPTION,
        specs: DEFAULT_SPECS.metaPaidSocial,
        priority: TRU_PRIORITY,
      };
    }

    if (legacy.pmaxGoogle) {
      const parts = [
        legacy.pmaxGoogle.video ? "Video MP4: Yes" : "",
        legacy.pmaxGoogle.notes,
      ].filter(Boolean) as string[];
      byId.pmaxGoogle = {
        ...byId.pmaxGoogle,
        enabled: !!legacy.pmaxGoogle.enabled,
        notes: parts.join(" · "),
        specs: DEFAULT_SPECS.pmaxGoogle,
        priority: TRU_PRIORITY,
      };
    }

    if (legacy.tiktok) {
      byId.tiktok = {
        ...byId.tiktok,
        enabled: !!legacy.tiktok.enabled,
        notes:
          [legacy.tiktok.primaryText, legacy.tiktok.notes]
            .filter(Boolean)
            .join(" · ")
            .trim() || TIKTOK_DESCRIPTION,
        specs: DEFAULT_SPECS.tiktok,
      };
    }

    if (legacy.olvYoutube) {
      const parts = [
        legacy.olvYoutube.shortHeadlines?.filter(Boolean).length
          ? `Short: ${legacy.olvYoutube.shortHeadlines.filter(Boolean).join(" | ")}`
          : "",
        legacy.olvYoutube.longHeadline &&
          `Long: ${legacy.olvYoutube.longHeadline}`,
        legacy.olvYoutube.descriptions?.filter(Boolean).length
          ? `Desc: ${legacy.olvYoutube.descriptions.filter(Boolean).join(" | ")}`
          : "",
        legacy.olvYoutube.cta && `CTA: ${legacy.olvYoutube.cta}`,
        legacy.olvYoutube.notes,
      ].filter(Boolean) as string[];
      byId.olvYoutube = {
        ...byId.olvYoutube,
        enabled: !!legacy.olvYoutube.enabled,
        notes: parts.join(" · ").trim() || OLV_DESCRIPTION,
        specs: "",
      };
    }

    return Object.values(byId);
  } catch {
    return createDefaultPaidMedia();
  }
}

export function normalizePaidMedia(value: unknown): PaidMedia {
  try {
    if (isNewShape(value)) {
      return value
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const defaultSpecs =
            item.id !== undefined && item.id in DEFAULT_SPECS
              ? DEFAULT_SPECS[item.id]
              : undefined;
          const existingNotes = (item.notes || "").trim();

          let notes = item.notes || "";
          if (item.id === "metaPaidSocial" && !existingNotes) {
            notes = META_DESCRIPTION;
          }
          if (item.id === "tiktok" && !existingNotes) {
            notes = TIKTOK_DESCRIPTION;
          }
          if (item.id === "olvYoutube") {
            // Refresh default OLV template when empty or still on the prior multi-line bullet layout
            if (
              !existingNotes ||
              existingNotes.includes("15 characters max :") ||
              (existingNotes.includes("3 Short headlines:") &&
                existingNotes.includes("• 30 characters max:\n"))
            ) {
              notes = OLV_DESCRIPTION;
            }
          }

          // Built-in specs / priority always refreshed for known ids
          const specs =
            item.id && item.id in DEFAULT_SPECS
              ? DEFAULT_SPECS[item.id]
              : (item.specs && item.specs.trim()) || defaultSpecs || "";

          const priority =
            item.id && DEFAULT_PRIORITY[item.id]
              ? DEFAULT_PRIORITY[item.id]
              : item.priority || "";

          return createPaidMediaAsset({
            ...item,
            title: item.title || "Untitled asset",
            specs,
            notes,
            priority,
          });
        });
    }
    if (isLegacyShape(value)) {
      return migrateLegacyPaidMedia(value);
    }
    return createDefaultPaidMedia();
  } catch {
    return createDefaultPaidMedia();
  }
}

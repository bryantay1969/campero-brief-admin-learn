import type { PhysicalAsset, PromoBrief } from "./types";
import {
  BUILTIN_LEGAL_TEMPLATES,
  findTemplateText,
} from "./legalTemplates";
import {
  createDefaultDigitalAssets,
  createDigitalAsset,
  createField,
} from "./digitalAssets";
import { createDefaultITElements } from "./itElements";
import { createDefaultPaidMedia } from "./paidMedia";
import type { FormAssetCatalogDef } from "./formAssetCatalog";
import { mergePhysicalWithCatalog } from "./formAssetCatalog";

import { isBriefOnlyAssetId, newBriefOnlyId } from "./briefOnlyIds";

function uid(): string {
  return newBriefOnlyId();
}

export const BUILT_IN_PHYSICAL_ASSET_IDS = new Set([
  "menuBoard",
  "mtvScreen",
  "dtScreen",
  "lto4thScreen",
  "bouncebackFront",
  "bouncebackBack",
  "bouncebackInstructions",
  "windowClings",
  "doorClings",
  "dtTopper",
  "registerDangler",
  "resSign",
  "counterCard",
  "digitalAFrame",
  "aFrame",
  "posOrderScreen",
  "kioskHomepage",
]);

export function isCustomPhysicalAsset(
  asset: PhysicalAsset,
  catalogSlugs?: Set<string>
): boolean {
  if (isBriefOnlyAssetId(asset.id)) return true;
  if (catalogSlugs && catalogSlugs.size > 0) {
    return !catalogSlugs.has(asset.id);
  }
  return !BUILT_IN_PHYSICAL_ASSET_IDS.has(asset.id);
}

export function mergePhysicalAssetsWithCatalog(
  briefAssets: PhysicalAsset[],
  catalog: FormAssetCatalogDef[]
): PhysicalAsset[] {
  return mergePhysicalWithCatalog(briefAssets, catalog, (p) =>
    createPhysicalAsset({
      id: p.id,
      label: p.label,
      specs: p.specs,
      notes: p.notes,
      enabled: p.enabled,
      priority: p.priority || "",
      linkLabel: p.linkLabel || "",
      linkHref: p.linkHref || "",
    })
  );
}

export function createPhysicalAsset(
  partial: Partial<PhysicalAsset> & { label: string }
): PhysicalAsset {
  return {
    id: partial.id || uid(),
    label: partial.label,
    specs: partial.specs ?? "",
    enabled: partial.enabled ?? false,
    notes: partial.notes ?? "",
    priority: partial.priority ?? "",
    linkLabel: partial.linkLabel ?? "",
    linkHref: partial.linkHref ?? "",
    notesPlaceholder: partial.notesPlaceholder ?? "",
  };
}

export function createPhysicalAssets(): PhysicalAsset[] {
  const items: { id: string; label: string; specs?: string }[] = [
    { id: "menuBoard", label: "Menu Board" },
    { id: "mtvScreen", label: "MTV Screen" },
    { id: "dtScreen", label: "DT Screen" },
    { id: "lto4thScreen", label: "LTO / 4th Screen" },
    { id: "bouncebackFront", label: "Bounceback (Front)" },
    { id: "bouncebackBack", label: "Bounceback (Back)" },
    { id: "bouncebackInstructions", label: "Bounceback Instruction Sheet" },
    {
      id: "windowClings",
      label: "Window Clings",
      specs: "24×32 / 36×48",
    },
    { id: "doorClings", label: "Door Clings" },
    { id: "dtTopper", label: "DT Topper" },
    { id: "registerDangler", label: "Register Dangler" },
    { id: "resSign", label: "RES Sign" },
    { id: "counterCard", label: "Counter Card" },
    { id: "digitalAFrame", label: "Digital A Frame" },
    { id: "aFrame", label: "A Frame" },
    { id: "posOrderScreen", label: "POS Order Screen" },
    {
      id: "kioskHomepage",
      label: "Kiosk Homepage Screen / Menu Cover",
      specs: "1080×1920 JPEG/GIF ≤20MB",
    },
  ];

  return items.map((item) =>
    createPhysicalAsset({
      id: item.id,
      label: item.label,
      specs: item.specs || "",
      enabled: false,
      notes: "",
    })
  );
}

export function formatPhysicalAssetDetail(asset: PhysicalAsset): string {
  const parts: string[] = [];
  if (asset.specs?.trim()) parts.push(asset.specs.trim());
  if (asset.notes?.trim()) parts.push(asset.notes.trim());
  return parts.join(" · ");
}

export function normalizePhysicalAssets(value: unknown): PhysicalAsset[] {
  if (!Array.isArray(value)) return createPhysicalAssets();
  const items = value
    .filter((item) => item && typeof item === "object")
    // Drop removed built-in "Other" row from older drafts
    .filter((item) => (item as Partial<PhysicalAsset>).id !== "otherPhysical")
    .map((item) => {
      const a = item as Partial<PhysicalAsset>;
      return createPhysicalAsset({
        id: a.id || uid(),
        label: a.label || "Untitled asset",
        specs: a.specs || "",
        enabled: !!a.enabled,
        notes: a.notes || "",
      });
    });
  return items.length > 0 ? items : createPhysicalAssets();
}

export function createEmptyBrief(): PromoBrief {
  const year = new Date().getFullYear();
  return {
    projectLead: "",
    promoName: "",
    launchDate: "",
    endDate: "",
    oneDayOnly: false,
    quickNote: "",
    loyaltyOnly: "",
    promoCodeNeeded: "",
    locations: "",
    dropOfferIntoLoyalty: false,
    dropOfferNote: "",

    messagingBullets: [{ id: uid(), text: "" }],
    creativeNotes: "",
    foodPhotoReferences: [{ id: uid(), name: "", link: "" }],
    noCamperoLogo: false,
    loyaltyMembersOnlyBadge: false,

    digitalAssets: createDefaultDigitalAssets(),

    itElements: createDefaultITElements(),

    paidMedia: createDefaultPaidMedia(),

    pr: {
      blogPost: {
        enabled: false,
        notes: "",
        imageSpecs: "",
      },
      pressRelease: {
        enabled: false,
        notes: "",
        bySpm: false,
      },
      custom: [],
    },

    physicalAssets: createPhysicalAssets(),

    // Truly empty — no template text until the user picks one on Legal
    legal: {
      templateId: "",
      legalText: "",
      copyrightVariant: "digital",
      copyrightYear: year,
    },
  };
}

/** National Fried Chicken Day – July 6 example (fully filled sample). */
export function createSampleBrief(): PromoBrief {
  const empty = createEmptyBrief();
  return {
    ...empty,
    projectLead: "Marketing Team",
    promoName: "National Fried Chicken Day",
    launchDate: "2025-07-06",
    endDate: "2025-07-06",
    oneDayOnly: true,
    quickNote:
      "This is email and organic social only. One-day celebration promo for National Fried Chicken Day.",
    loyaltyOnly: "yes",
    promoCodeNeeded: "no",
    locations: "National",
    dropOfferIntoLoyalty: true,
    dropOfferNote:
      "Drop BOGO (or featured fried chicken offer) into eligible Rewards accounts in the Rewards section ahead of launch.",

    messagingBullets: [
      {
        id: uid(),
        text: "Celebrate National Fried Chicken Day with Pollo Campero",
      },
      {
        id: uid(),
        text: "Loyalty members: exclusive offer waiting in Rewards",
      },
      {
        id: uid(),
        text: "Crispy, golden fried chicken — available for one day only",
      },
      {
        id: uid(),
        text: "Open the app or sign in at www.campero.com to redeem",
      },
    ],
    creativeNotes:
      "Hero: golden fried chicken pieces, appetizing close-up with warm lighting. Emphasize crunch and Campero seasoning. Keep plates clean — no unauthorized sides. Lifestyle optional: family sharing at table. Tone: celebratory, warm, limited-time urgency without feeling spammy.",
    foodPhotoReferences: [
      {
        id: uid(),
        name: "POC_NFCD_Hero_FriedChicken_01.jpg",
        link: "",
      },
      {
        id: uid(),
        name: "POC_NFCD_Detail_Crunch_02.jpg",
        link: "",
      },
      {
        id: uid(),
        name: "POC_Loyalty_Badge_Only_v3.png",
        link: "",
      },
    ],
    noCamperoLogo: true,
    loyaltyMembersOnlyBadge: true,

    digitalAssets: createDefaultDigitalAssets().map((asset) => {
      if (asset.id === "organicPosts") {
        return createDigitalAsset({
          ...asset,
          enabled: true,
          notes:
            "Feed + story crops. Animated preferred. Include still thumbnail for platforms that require it.",
        });
      }
      if (asset.id === "email") {
        return createDigitalAsset({
          ...asset,
          enabled: true,
          notes:
            "PRIORITY: Submit to Punchh on schedule. Main module + rich image. Secondary module optional if space.",
          fields: asset.fields.map((f) =>
            f.id === "email-main" || f.id === "email-rich"
              ? createField({ ...f, checked: true })
              : f
          ),
        });
      }
      if (asset.id === "websiteCarousel") {
        return createDigitalAsset({
          ...asset,
          enabled: false,
          notes: "Not in scope for this one-day email/social push.",
        });
      }
      return asset;
    }),

    itElements: createDefaultITElements(),

    paidMedia: createDefaultPaidMedia().map((asset) =>
      asset.id === "metaPaidSocial"
        ? { ...asset, notes: "No paid media for this promo." }
        : asset
    ),

    pr: {
      blogPost: {
        enabled: false,
        notes: "Not planned for NFCD this year.",
        imageSpecs: "Link to specs example files",
      },
      pressRelease: {
        enabled: false,
        notes: "",
        bySpm: false,
      },
    },

    physicalAssets: createPhysicalAssets(),

    legal: {
      templateId: "bogoLoyalty",
      legalText:
        findTemplateText(BUILTIN_LEGAL_TEMPLATES, "bogoLoyalty") || "",
      copyrightVariant: "digital",
      copyrightYear: new Date().getFullYear(),
    },

    lastSaved: new Date().toISOString(),
  };
}

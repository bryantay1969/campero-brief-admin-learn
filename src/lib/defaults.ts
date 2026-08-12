import type { PhysicalAsset, PromoBrief } from "./types";
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

    messagingBullets: "",
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

/** National Fried Chicken Day sample — from client export (2026-08-12T17:14:11.064Z). */
export function createSampleBrief(): PromoBrief {
  const empty = createEmptyBrief();
  return {
    ...empty,
    projectLead: "Allie Abilez",
    promoName: "National Fried Chicken Day",
    launchDate: "2026-07-06",
    endDate: "2026-07-06",
    oneDayOnly: true,
    quickNote: "We can drop this offer into loyalty accounts in the Rewards section",
    loyaltyOnly: "yes",
    promoCodeNeeded: "no",
    locations: "National",
    dropOfferIntoLoyalty: true,
    dropOfferNote: "Drop BOGO (or featured fried chicken offer) into eligible Rewards accounts in the Rewards section ahead of launch.",

    messagingBullets: "$5 off\n- For National Fried chicken day\n- $15 Minimum purchase\n- 7/6\n- Loyalty members only (badge)",
    creativeNotes: "No campero logo since this is owned channels",
    foodPhotoReferences: [
      {
        id: uid(),
        name: "COB Hero image",
        link: "https://oneomnicom.sharepoint.com/:i:/r/sites/POLLOCAMPERO-FORCLIENTS/Shared%20Documents/GENERAL/IMAGERY/2025%20Library%202-0__Stills/POC_116355_PHOTO_HERO_FOOD_2025-06-04_JPGs/POC_116355_PHOTO_HERO_FOOD_2025-06-04_COB-FR_20PC-MIXED-NOHANDS_STR-ON_FINAL.jpg?csf=1&web=1&e=Op6fxM",
      },
      {
        id: uid(),
        name: "20 PC Dark White",
        link: "https://oneomnicom.sharepoint.com/:i:/r/sites/POLLOCAMPERO-FORCLIENTS/Shared%20Documents/GENERAL/IMAGERY/2025%20Library%202-0__Stills/POC_116355_PHOTO_HERO_FOOD_2025-06-04_JPGs/POC_116355_PHOTO_HERO_FOOD_2025-06-04_COB-FR_20PC-DARK-WHITE_SWEEP_STR-ON_FINAL.jpg?csf=1&web=1&e=B00TsO",
      },
    ],
    noCamperoLogo: true,
    loyaltyMembersOnlyBadge: true,

    digitalAssets: [
      createDigitalAsset({
        id: "organicPosts",
        title: "Organic Post(s)",
        specs: "1080×1080, 1080×1350, Static (unless noted otherwise), Include same size thumbnail Image for each asset",
        enabled: true,
        notes: "Also include Thumbnail Image for each asset\n• [Note: same dimensions as requested asset: 1080x1350 post requires a 1080x1350 thumbnail\n1080x1080 requires a 1080x1080 thumbnail]\nStatic (unless noted otherwise)",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
      createDigitalAsset({
        id: "email",
        title: "Email",
        specs: "Static (unless noted otherwise)",
        enabled: true,
        notes: "",
        priority: "Priority asset as we need to submit to Punchh 4 business days in advance",
        linkLabel: "Layered Photoshop Specs",
        linkHref: "https://www.dropbox.com/scl/fo/fkc1yxaywf20md6c9uaav/AFJUPGCH1u9-bhIGRW0vjxg?rlkey=gvlc3ojb5nuli8ibzddfcjblu&st=cnyiifzq&e=1&dl=0",
        notesPlaceholder: "",
        fields: [
          createField({
            id: "email-main",
            label: "Main Module",
            value: "",
            type: "checkbox",
            checked: true,
          }),
          createField({
            id: "email-rich",
            label: "Rich Image",
            value: "",
            type: "checkbox",
            checked: true,
          }),
          createField({
            id: "email-secondary",
            label: "Secondary Module",
            value: "",
            type: "checkbox",
            checked: true,
          }),
        ],
      }),
      createDigitalAsset({
        id: "websiteCarousel",
        title: "Website Carousel",
        specs: "Static (unless noted otherwise), Save files as WebP Lossy 75 high",
        enabled: true,
        notes: "Not in scope for this one-day email/social push.",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
      createDigitalAsset({
        id: "In-AppCarousel",
        title: "In-App Carousel",
        specs: "1024x500, Static Jpeg files",
        enabled: false,
        notes: "",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
      createDigitalAsset({
        id: "smsCopy",
        title: "SMS Copy",
        specs: "160 character limit",
        enabled: false,
        notes: "Example: \nOrder Pollo Campero from the convenience of your home. \nEnjoy $5 off $20 code CAMPERO5. \nParticipating locations only. Expires 2/3/25\nhttps://order.campero.com",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
      createDigitalAsset({
        id: "whatsappCopy",
        title: "WhatsApp Copy",
        specs: "No character limit - cannot be segmented",
        enabled: false,
        notes: "",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
      createDigitalAsset({
        id: "socialHeaders",
        title: "Social Headers",
        specs: "Static (unless noted otherwise)",
        enabled: false,
        notes: "",
        priority: "",
        linkLabel: "",
        linkHref: "",
        notesPlaceholder: "",
        fields: [

        ],
      }),
    ],

    itElements: [
          {
                "id": "oloKoalaImage",
                "title": "OLO / Koala Image",
                "specs": "Static Product Images",
                "enabled": true,
                "notes": "Static Product Image\n• OLO: 900 x 600px PNG image(s)\n• Koala: 2000 x 2000px PNG image(s)",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "oloDescription",
                "title": "OLO Description",
                "specs": "Category, Title, and Description for online ordering",
                "enabled": false,
                "notes": "• Category: Under XXX\n• Title:\n• Description:",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "ezCaterImage",
                "title": "EZ Cater Image",
                "specs": "Static Product Image - 1200 x 800px PNG image(s)",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          }
    ],

    paidMedia: [
          {
                "id": "metaPaidSocial",
                "title": "Meta Paid Social",
                "specs": "1080×1080 / 1080×1920, Animated (unless noted otherwise)",
                "enabled": true,
                "notes": "• Headline: 27 characters (including spaces)\n• Primary text/body: 125 characters (including spaces)",
                "priority": "Due to Tru 1 week early",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "pmaxGoogle",
                "title": "PMAX / Google",
                "specs": "1200x1200; 1200x628, Optional 960x1200 - Animated (unless noted otherwise)",
                "enabled": true,
                "notes": "",
                "priority": "Due to Tru 1 week early",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "tiktok",
                "title": "TikTok Paid Media",
                "specs": "Primary text ≤100 characters",
                "enabled": false,
                "notes": "Primary Text: 100 Characters",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "olvYoutube",
                "title": "OLV / YouTube",
                "specs": "",
                "enabled": false,
                "notes": "3 Short headlines:\n• 30 characters max: • 30 characters max: • 15 characters max\n\n1 Long headline:\n• 90 characters max:\n\n2 Description:\n• 90 characters max: • 60 characters max\n\n1 CTA",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          }
    ],

    pr: {
          "custom": [],
          "blogPost": {
                "notes": "",
                "enabled": true,
                "imageSpecs": "Link to specs example files"
          },
          "pressRelease": {
                "bySpm": false,
                "notes": "",
                "enabled": false
          }
    },

    physicalAssets: [
          {
                "id": "menuBoard",
                "label": "Menu Board",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "mtvScreen",
                "label": "MTV Screen",
                "specs": "",
                "enabled": true,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "dtScreen",
                "label": "DT Screen",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "lto4thScreen",
                "label": "LTO / 4th Screen",
                "specs": "",
                "enabled": true,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "bouncebackFront",
                "label": "Bounceback (Front)",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "bouncebackBack",
                "label": "Bounceback (Back)",
                "specs": "",
                "enabled": true,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "bouncebackInstructions",
                "label": "Bounceback Instruction Sheet",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "windowClings",
                "label": "Window Clings",
                "specs": "24×32 / 36×48",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "doorClings",
                "label": "Door Clings",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "dtTopper",
                "label": "DT Topper",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "registerDangler",
                "label": "Register Dangler",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "resSign",
                "label": "RES Sign",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "counterCard",
                "label": "Counter Card",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "digitalAFrame",
                "label": "Digital A Frame",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "aFrame",
                "label": "A Frame",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "posOrderScreen",
                "label": "POS Order Screen",
                "specs": "",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          },
          {
                "id": "kioskHomepage",
                "label": "Kiosk Homepage Screen / Menu Cover",
                "specs": "1080×1920 JPEG/GIF ≤20MB",
                "enabled": false,
                "notes": "",
                "priority": "",
                "linkLabel": "",
                "linkHref": "",
                "notesPlaceholder": ""
          }
    ],

    legal: {
      templateId: "standard",
      legalText: "Offer valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.",
      copyrightVariant: "digital",
      copyrightYear: 2026,
    },

    lastSaved: new Date().toISOString(),
  };
}

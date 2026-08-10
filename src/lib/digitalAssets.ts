import type {
  DigitalAssetField,
  DigitalAssetItem,
  DigitalAssets,
  LegacyDigitalAssets,
} from "./types";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createField(
  partial: Partial<DigitalAssetField> & { label: string }
): DigitalAssetField {
  return {
    id: partial.id || uid(),
    label: partial.label,
    value: partial.value ?? "",
    type: partial.type || "text",
    charLimit: partial.charLimit,
    checked: partial.checked ?? false,
  };
}

export function createDigitalAsset(
  partial: Partial<DigitalAssetItem> & { title: string }
): DigitalAssetItem {
  return {
    id: partial.id || uid(),
    title: partial.title,
    specs: partial.specs ?? "",
    enabled: partial.enabled ?? false,
    notes: partial.notes ?? "",
    priority: partial.priority ?? "",
    fields: partial.fields ?? [],
  };
}

/** Built-in asset id for the email row (keeps module checkboxes). */
export const EMAIL_ASSET_ID = "email";

export const BUILT_IN_DIGITAL_ASSET_IDS = new Set([
  "organicPosts",
  EMAIL_ASSET_ID,
  "websiteCarousel",
  "smsCopy",
  "whatsappCopy",
  "socialHeaders",
]);

export function isEmailAsset(asset: DigitalAssetItem): boolean {
  return asset.id === EMAIL_ASSET_ID || asset.title.trim().toLowerCase() === "email";
}

/** User-added rows can edit title + subtitle; built-ins keep fixed labels. */
export function isCustomDigitalAsset(asset: DigitalAssetItem): boolean {
  return !BUILT_IN_DIGITAL_ASSET_IDS.has(asset.id);
}

/** Default Campero digital asset checklist. Non-email rows use checkbox + description only. */
export function createDefaultDigitalAssets(): DigitalAssets {
  return [
    createDigitalAsset({
      id: "organicPosts",
      title: "Organic Post(s)",
      specs: "1080×1080, 1080×1350",
      fields: [],
    }),
    createDigitalAsset({
      id: EMAIL_ASSET_ID,
      title: "Email",
      specs: "Main Module, Rich Image, Secondary Module (Static)",
      priority:
        "Priority asset as we need to submit to Punchh 4 business days in advance",
      fields: [
        createField({
          id: "email-main",
          label: "Main Module",
          type: "checkbox",
          checked: true,
        }),
        createField({
          id: "email-rich",
          label: "Rich Image",
          type: "checkbox",
          checked: false,
        }),
        createField({
          id: "email-secondary",
          label: "Secondary Module",
          type: "checkbox",
          checked: false,
        }),
      ],
    }),
    createDigitalAsset({
      id: "websiteCarousel",
      title: "Website Carousel",
      specs:
        "Static (unless noted otherwise), Save files as WebP Lossy 75 high",
      fields: [],
    }),
    createDigitalAsset({
      id: "smsCopy",
      title: "SMS Copy",
      specs: "160 character limit",
      fields: [],
    }),
    createDigitalAsset({
      id: "whatsappCopy",
      title: "WhatsApp Copy",
      specs: "No character limit - cannot be segmented",
      fields: [],
    }),
    createDigitalAsset({
      id: "socialHeaders",
      title: "Social Headers",
      specs: "Static (unless noted otherwise)",
      fields: [],
    }),
  ];
}

export function formatDigitalAssetDetail(asset: DigitalAssetItem): string {
  const parts: string[] = [];

  if (asset.specs.trim()) parts.push(asset.specs.trim());

  if (isEmailAsset(asset)) {
    for (const f of asset.fields) {
      if (f.type === "checkbox") {
        parts.push(`${f.label}: ${f.checked ? "Yes" : "No"}`);
      } else if (f.value.trim()) {
        parts.push(`${f.label}: ${f.value.trim()}`);
      }
    }
    if (asset.priority.trim()) parts.push(`Priority: ${asset.priority.trim()}`);
  }

  if (asset.notes.trim()) parts.push(asset.notes.trim());
  return parts.join(" · ");
}

function isNewShape(value: unknown): value is DigitalAssets {
  return Array.isArray(value);
}

function isLegacyShape(value: unknown): value is LegacyDigitalAssets {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "organicPosts" in value
  );
}

/** Convert legacy fixed digital object → editable list. */
export function migrateLegacyDigitalAssets(
  legacy: LegacyDigitalAssets
): DigitalAssets {
  try {
    const base = createDefaultDigitalAssets();
    const byId = Object.fromEntries(base.map((a) => [a.id, a]));

    const set = (id: string, patch: Partial<DigitalAssetItem>) => {
      if (byId[id]) byId[id] = { ...byId[id], ...patch };
    };

    const setField = (
      assetId: string,
      fieldId: string,
      patch: Partial<DigitalAssetField>
    ) => {
      const asset = byId[assetId];
      if (!asset) return;
      byId[assetId] = {
        ...asset,
        fields: asset.fields.map((f) =>
          f.id === fieldId ? { ...f, ...patch } : f
        ),
      };
    };

    if (legacy.organicPosts) {
      set("organicPosts", {
        enabled: !!legacy.organicPosts.enabled,
        notes: legacy.organicPosts.notes || "",
        specs: legacy.organicPosts.sizes || byId.organicPosts.specs,
      });
      setField("organicPosts", "organic-format", {
        value:
          legacy.organicPosts.format === "static"
            ? "Static"
            : "Animated (default) or Static",
      });
      setField("organicPosts", "organic-thumbnail", {
        checked: !!legacy.organicPosts.thumbnailNote,
      });
    }

    if (legacy.email) {
      set("email", {
        enabled: !!legacy.email.enabled,
        notes: legacy.email.notes || "",
      });
      setField("email", "email-main", {
        checked: !!legacy.email.mainModule,
      });
      setField("email", "email-rich", {
        checked: !!legacy.email.richImage,
      });
      setField("email", "email-secondary", {
        checked: !!legacy.email.secondaryModule,
      });
    }

    if (legacy.websiteCarousel) {
      set("websiteCarousel", {
        enabled: !!legacy.websiteCarousel.enabled,
        notes: legacy.websiteCarousel.notes || "",
        specs: DEFAULT_SPECS.websiteCarousel,
      });
    }

    if (legacy.smsCopy) {
      set("smsCopy", {
        enabled: !!legacy.smsCopy.enabled,
        notes:
          legacy.smsCopy.notes?.trim() ||
          legacy.smsCopy.copy?.trim() ||
          "",
      });
    }

    if (legacy.whatsappCopy) {
      set("whatsappCopy", {
        enabled: !!legacy.whatsappCopy.enabled,
        notes: legacy.whatsappCopy.notes || "",
      });
      setField("whatsappCopy", "wa-copy", {
        value: legacy.whatsappCopy.copy || "",
      });
    }

    if (legacy.socialHeaders) {
      set("socialHeaders", {
        enabled: !!legacy.socialHeaders.enabled,
        notes: legacy.socialHeaders.notes || "",
      });
    }

    // Built-in "Other" row removed — not migrated

    return Object.values(byId);
  } catch {
    return createDefaultDigitalAssets();
  }
}

/** Default subtitle/specs by built-in asset id (for UI + migration). */
const DEFAULT_SPECS: Record<string, string> = {
  organicPosts: "1080×1080, 1080×1350",
  email: "Main Module, Rich Image, Secondary Module (Static)",
  websiteCarousel:
    "Static (unless noted otherwise), Save files as WebP Lossy 75 high",
  smsCopy: "160 character limit",
  whatsappCopy: "No character limit - cannot be segmented",
  socialHeaders: "Static (unless noted otherwise)",
};

const EMAIL_PRIORITY =
  "Priority asset as we need to submit to Punchh 4 business days in advance";

/** Placeholder hint for SMS description (not stored as value). */
export const SMS_DESCRIPTION_PLACEHOLDER =
  "Example: Enjoy 15% off Pollo Campero Catering and have a feast for the Big Game Code HUDDLE15 Ends 2/9. at participating locations only https://catering.campero.com";

/** Placeholder hint for WhatsApp description (not stored as value). */
export const WHATSAPP_DESCRIPTION_PLACEHOLDER =
  "Example: Enjoy 15% off Pollo Campero Catering and have a feast for the Big Game Code HUDDLE15 Ends 2/9";

/** Older prefilled multi-line example (clear from drafts so it becomes placeholder-only). */
const LEGACY_SMS_PREFILL = `Example: Order Pollo Campero from
the convenience of your home. Enjoy
$5 off $20 code CAMPERO5.
Participating locations only. Expires
2/3/25 https://order.campero.com`;

function cleanSmsNotes(notes: string | undefined): string {
  const n = (notes || "").trim();
  if (!n) return "";
  if (n === SMS_DESCRIPTION_PLACEHOLDER.trim()) return "";
  if (n === LEGACY_SMS_PREFILL.trim()) return "";
  // Normalize whitespace compare for multi-line vs single-line variants
  const collapsed = n.replace(/\s+/g, " ");
  if (
    collapsed ===
    SMS_DESCRIPTION_PLACEHOLDER.replace(/\s+/g, " ").trim()
  ) {
    return "";
  }
  return notes || "";
}

/** Normalize any stored digitalAssets value to the current list shape. */
export function normalizeDigitalAssets(value: unknown): DigitalAssets {
  try {
    if (isNewShape(value)) {
      return value
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const defaultSpecs = item.id ? DEFAULT_SPECS[item.id] : undefined;
          // Keep built-in subtitles current for known ids
          const specs =
            item.id === "websiteCarousel" ||
            item.id === "whatsappCopy" ||
            item.id === "socialHeaders"
              ? DEFAULT_SPECS[item.id]
              : (item.specs && item.specs.trim()) || defaultSpecs || "";
          const notes =
            item.id === "smsCopy"
              ? cleanSmsNotes(item.notes)
              : item.notes || "";
          return createDigitalAsset({
            ...item,
            title: item.title || "Untitled asset",
            specs,
            notes,
            priority:
              item.id === EMAIL_ASSET_ID || item.id === "email"
                ? EMAIL_PRIORITY
                : item.priority || "",
            fields: Array.isArray(item.fields)
              ? item.fields
                  .filter((f) => f && typeof f === "object")
                  .map((f) =>
                    createField({
                      ...f,
                      label: f.label || "Field",
                    })
                  )
              : [],
          });
        })
        // Drop removed built-in "Other" row from older drafts
        .filter((item) => item.id !== "other");
    }
    if (isLegacyShape(value)) {
      return migrateLegacyDigitalAssets(value);
    }
    return createDefaultDigitalAssets();
  } catch {
    return createDefaultDigitalAssets();
  }
}

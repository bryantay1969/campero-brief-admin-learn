export type YesNo = "yes" | "no" | "";

export interface MessagingBullet {
  id: string;
  text: string;
}

/** Named photography / creative asset reference with optional link. */
export interface PhotoAssetReference {
  id: string;
  name: string;
  link: string;
}

export interface AssetItem {
  enabled: boolean;
  notes: string;
}

/** Dynamic sub-field on a digital asset (copy, checkbox, free text, etc.). */
export interface DigitalAssetField {
  id: string;
  label: string;
  /** text / textarea value */
  value: string;
  type: "text" | "textarea" | "checkbox";
  /** When type is checkbox */
  checked?: boolean;
  /** Optional live character limit (e.g. SMS 160) */
  charLimit?: number;
}

/** Editable digital asset row — users can add, rename, and extend fields. */
export interface DigitalAssetItem {
  id: string;
  title: string;
  /** Specs / sizes / format line */
  specs: string;
  enabled: boolean;
  notes: string;
  /** Optional priority callout */
  priority: string;
  /** Optional link under the title (from shared catalog) */
  linkLabel?: string;
  linkHref?: string;
  /** Placeholder hint for description (brief-only / catalog) */
  notesPlaceholder?: string;
  fields: DigitalAssetField[];
}

export type DigitalAssets = DigitalAssetItem[];

/** @deprecated Legacy fixed shape — still accepted via migration. */
export interface LegacyDigitalAssets {
  organicPosts: AssetItem & {
    sizes: string;
    format: "animated" | "static";
    thumbnailNote: boolean;
  };
  email: AssetItem & {
    mainModule: boolean;
    richImage: boolean;
    secondaryModule: boolean;
  };
  websiteCarousel: AssetItem & {
    format: string;
  };
  smsCopy: AssetItem & {
    copy: string;
  };
  whatsappCopy: AssetItem & {
    copy: string;
  };
  socialHeaders: AssetItem;
  other: AssetItem & {
    description: string;
  };
}

/** Editable IT / OLO asset row — checkbox, subtitle, description. */
export interface ITAssetItem {
  id: string;
  title: string;
  /** Specs / sizes subtitle under the title */
  specs: string;
  enabled: boolean;
  /** Description / notes */
  notes: string;
  /** Optional highlighted priority callout */
  priority?: string;
  /** Optional link under the title (from shared catalog) */
  linkLabel?: string;
  linkHref?: string;
  /** Placeholder hint for description */
  notesPlaceholder?: string;
}

export type ITElements = ITAssetItem[];

/** @deprecated Legacy fixed shape — still accepted via migration. */
export interface LegacyITElements {
  oloKoalaImage: AssetItem & {
    sizes: string;
  };
  oloDescription: AssetItem & {
    category: string;
    title: string;
    description: string;
  };
  ezCaterImage: AssetItem & {
    size: string;
  };
  nonFoodItAlert: boolean;
  nonFoodNote: string;
}

/** Editable paid media row — checkbox, subtitle, description. */
export interface PaidMediaAssetItem {
  id: string;
  title: string;
  /** Specs / sizes subtitle under the title */
  specs: string;
  enabled: boolean;
  /** Description / notes / copy */
  notes: string;
  /** Optional highlighted priority callout */
  priority?: string;
  /** Optional link under the title (from shared catalog) */
  linkLabel?: string;
  linkHref?: string;
  /** Placeholder hint for description */
  notesPlaceholder?: string;
}

export type PaidMedia = PaidMediaAssetItem[];

/** @deprecated Legacy fixed shape — still accepted via migration. */
export interface LegacyPaidMedia {
  metaPaidSocial: AssetItem & {
    sizes: string;
    format: string;
    headline: string;
    primaryText: string;
  };
  pmaxGoogle: AssetItem & {
    sizes: string;
    video: boolean;
  };
  tiktok: AssetItem & {
    primaryText: string;
  };
  olvYoutube: AssetItem & {
    shortHeadlines: [string, string, string];
    longHeadline: string;
    descriptions: [string, string];
    cta: string;
  };
}

/** Brief-only PR row (not from the shared catalog). */
export interface PRCustomAsset {
  id: string;
  title: string;
  specs: string;
  enabled: boolean;
  notes: string;
  priority?: string;
  linkLabel?: string;
  linkHref?: string;
  notesPlaceholder?: string;
}

export interface PRAssets {
  blogPost: AssetItem & {
    imageSpecs: string;
  };
  pressRelease: AssetItem & {
    bySpm: boolean;
  };
  /** Optional one-off PR items for this brief only */
  custom?: PRCustomAsset[];
}

/** In-store / physical asset — name, subtitle, description (same pattern as Digital). */
export interface PhysicalAsset {
  id: string;
  /** Display name (list title) */
  label: string;
  /** Subtitle under the name (sizes, format, etc.) */
  specs: string;
  enabled: boolean;
  /** Description / production notes */
  notes: string;
  /** Optional highlighted priority callout */
  priority?: string;
  /** Optional link under the title (from shared catalog) */
  linkLabel?: string;
  linkHref?: string;
  /** Placeholder hint for description */
  notesPlaceholder?: string;
}

/** Slug of a legal template, or "custom" when free-edited. */
export type LegalTemplateId = string;

export interface LegalSection {
  templateId: LegalTemplateId;
  legalText: string;
  copyrightVariant: "print" | "digital";
  copyrightYear: number;
}

export interface PromoBrief {
  // Promo Overview
  projectLead: string;
  promoName: string;
  launchDate: string;
  endDate: string;
  oneDayOnly: boolean;
  quickNote: string;
  loyaltyOnly: YesNo;
  promoCodeNeeded: YesNo;
  locations: string;
  dropOfferIntoLoyalty: boolean;
  dropOfferNote: string;

  // Messaging & Creative
  messagingBullets: MessagingBullet[];
  creativeNotes: string;
  /** Photography / asset references (name + link pairs). */
  foodPhotoReferences: PhotoAssetReference[];
  noCamperoLogo: boolean;
  loyaltyMembersOnlyBadge: boolean;

  // Sections
  digitalAssets: DigitalAssets;
  itElements: ITElements;
  paidMedia: PaidMedia;
  pr: PRAssets;
  physicalAssets: PhysicalAsset[];
  legal: LegalSection;

  // Meta
  lastSaved?: string;
}

/** A named brief stored in the local library for later revisit/edit. */
export interface SavedBriefRecord {
  id: string;
  /** User-facing library name (defaults to promo name). */
  name: string;
  createdAt: string;
  updatedAt: string;
  brief: PromoBrief;
  /** Public preview token for /preview/<token> (view-only). */
  shareToken?: string | null;
}

export type SectionId =
  | "overview"
  | "messaging"
  | "digital"
  | "it"
  | "paid"
  | "pr"
  | "physical"
  | "legal"
  | "review";

export interface SectionMeta {
  id: SectionId;
  label: string;
  shortLabel: string;
}

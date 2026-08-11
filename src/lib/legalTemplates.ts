/** Built-in legal templates (fallback if Supabase is empty/offline). */

export type LegalTemplateDef = {
  /** Form template id / slug */
  id: string;
  slug: string;
  label: string;
  description: string;
  text: string;
  /** Present when loaded from database */
  dbId?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export const BUILTIN_LEGAL_TEMPLATES: LegalTemplateDef[] = [
  {
    id: "standard",
    slug: "standard",
    label: "Standard",
    description: "General promo legal language",
    text: `Offer valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
  {
    id: "bogoLoyalty",
    slug: "bogoLoyalty",
    label: "BOGO / Loyalty",
    description: "Loyalty members only / rewards redemption",
    text: `Offer available exclusively to Pollo Campero Rewards members. Must be a registered Rewards member and signed in to redeem. Offer will be deposited into eligible Rewards accounts. Limit one redemption per member. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Offer valid only during the promotional period at participating locations. Pollo Campero reserves the right to modify or cancel this offer at any time. See campero.com/rewards for full Rewards program terms.`,
  },
  {
    id: "inStoreOnly",
    slug: "inStoreOnly",
    label: "In-Store Only",
    description: "In-store redemption only",
    text: `Offer valid for in-store purchases only at participating Pollo Campero locations. Not valid for online ordering, delivery, or third-party platforms. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
  {
    id: "ews",
    slug: "ews",
    label: "EWS",
    description: "Employee / internal or limited distribution",
    text: `Offer valid at participating Pollo Campero locations. Must present this communication or qualifying code at time of purchase where applicable. Limit one per person/transaction unless otherwise stated. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period.`,
  },
  {
    id: "menuItemLimit",
    slug: "menuItemLimit",
    label: "Menu Item Limit",
    description: "Specific item quantity limits",
    text: `Offer applies to specified menu item(s) only. Limit one promotional item per transaction unless otherwise stated. Valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
];

/** @deprecated Use BUILTIN_LEGAL_TEMPLATES or fetchLegalTemplatesForForm */
export const LEGAL_TEMPLATES: Record<
  string,
  { label: string; description: string; text: string }
> = Object.fromEntries(
  BUILTIN_LEGAL_TEMPLATES.map((t) => [
    t.slug,
    { label: t.label, description: t.description, text: t.text },
  ])
);

export function getCopyrightLine(
  variant: "print" | "digital",
  year: number
): string {
  if (variant === "print") {
    return `© ${year} Campero USA Corp. All rights reserved. Pollo Campero® is a registered trademark.`;
  }
  return `© ${year} Campero USA Corp. All rights reserved. Pollo Campero® and the Pollo Campero logo are registered trademarks of Campero USA Corp. Visit www.campero.com for more information.`;
}

export function findTemplateText(
  templates: LegalTemplateDef[],
  slug: string
): string | undefined {
  return templates.find((t) => t.slug === slug || t.id === slug)?.text;
}

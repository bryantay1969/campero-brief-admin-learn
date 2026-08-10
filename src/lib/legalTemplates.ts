import type { LegalTemplateId } from "./types";

export const LEGAL_TEMPLATES: Record<
  Exclude<LegalTemplateId, "custom">,
  { label: string; description: string; text: string }
> = {
  standard: {
    label: "Standard",
    description: "General promo legal language",
    text: `Offer valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
  bogoLoyalty: {
    label: "BOGO / Loyalty",
    description: "Loyalty members only / rewards redemption",
    text: `Offer available exclusively to Pollo Campero Rewards members. Must be a registered Rewards member and signed in to redeem. Offer will be deposited into eligible Rewards accounts. Limit one redemption per member. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Offer valid only during the promotional period at participating locations. Pollo Campero reserves the right to modify or cancel this offer at any time. See campero.com/rewards for full Rewards program terms.`,
  },
  inStoreOnly: {
    label: "In-Store Only",
    description: "In-store redemption only",
    text: `Offer valid for in-store purchases only at participating Pollo Campero locations. Not valid for online ordering, delivery, or third-party platforms. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
  ews: {
    label: "EWS",
    description: "Employee / internal or limited distribution",
    text: `Offer valid at participating Pollo Campero locations. Must present this communication or qualifying code at time of purchase where applicable. Limit one per person/transaction unless otherwise stated. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period.`,
  },
  menuItemLimit: {
    label: "Menu Item Limit",
    description: "Specific item quantity limits",
    text: `Offer applies to specified menu item(s) only. Limit one promotional item per transaction unless otherwise stated. Valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.`,
  },
};

export function getCopyrightLine(
  variant: "print" | "digital",
  year: number
): string {
  if (variant === "print") {
    return `© ${year} Campero USA Corp. All rights reserved. Pollo Campero® is a registered trademark.`;
  }
  return `© ${year} Campero USA Corp. All rights reserved. Pollo Campero® and the Pollo Campero logo are registered trademarks of Campero USA Corp. Visit www.campero.com for more information.`;
}

export const BRAND_GUIDELINES = {
  productNaming: [
    "Use “Roasted Chicken” (not “rotisserie” or generic “chicken” alone when referring to the hero product).",
    "Use full menu names as approved (e.g., Family Meal, 2 Piece Meal).",
    "Capitalize product names consistently with approved menu nomenclature.",
  ],
  neverInclude: ["Cookies", "Bowl", "Mac & Cheese", "Salad"],
  drinkRules: [
    "No straws in photography or creative.",
    "Orange cup = Regular size.",
    "Green cup = Large size.",
    "Do not invent cup colors or sizes outside brand standards.",
  ],
  logoRules: [
    "Stacked logo is primary lockup.",
    "No slanted logo treatment unless intentional sub-copy treatment is approved.",
    "Maintain clear space and minimum size; do not recolor off-brand.",
    "Owned-channel exceptions (e.g., “no logo”) must be noted in the brief.",
  ],
  pieceFormatting: [
    "Use “2 Piece” or “2PC” consistently as directed per asset.",
    "Avoid mixed formats in the same campaign set (e.g., “2-pc” + “2 Piece”).",
  ],
  dateFormatting: [
    "Prefer “July 6” or “July 6–12” style for consumer-facing copy when space allows.",
    "Use consistent month spelling (no mixed “Jul” / “July” in the same set).",
    "For one-day promos, call out the single date clearly.",
  ],
  andVsAmpersand: [
    "Prefer “&” in short headlines and tight spaces when brand-approved.",
    "Use “and” in longer body copy and legal language when it reads more naturally.",
    "Stay consistent within a single asset.",
  ],
  proteinMessaging: [
    "Follow approved protein / chicken quality messaging; do not invent claims.",
    "Avoid unapproved comparative or health claims.",
    "Any new claim language requires legal review before production.",
  ],
  websiteFormatting: [
    "Use www.campero.com only (do not use alternate domains or bare campero.com in consumer creative unless approved).",
    "Do not invent vanity URLs without marketing + IT approval.",
  ],
  socialIconOrder: [
    "Follow approved social icon order from brand toolkit (do not rearrange).",
    "Only include active/official channels.",
  ],
} as const;

export const SECTIONS = [
  { id: "overview" as const, label: "Promo Overview", shortLabel: "Overview" },
  {
    id: "messaging" as const,
    label: "Messaging & Creative Direction",
    shortLabel: "Messaging",
  },
  { id: "digital" as const, label: "Digital Assets", shortLabel: "Digital" },
  {
    id: "it" as const,
    label: "IT / Online Ordering Assets",
    shortLabel: "IT / OLO",
  },
  { id: "paid" as const, label: "Paid Media", shortLabel: "Paid Media" },
  { id: "pr" as const, label: "PR", shortLabel: "PR" },
  {
    id: "physical" as const,
    label: "Physical / In-Store Assets",
    shortLabel: "In-Store",
  },
  { id: "legal" as const, label: "Legal", shortLabel: "Legal" },
  {
    id: "review" as const,
    label: "Review",
    shortLabel: "Review",
  },
];

import type { CatalogSection, FormAssetCatalogDef } from "./formAssetCatalog";

function D(
  partial: Omit<
    FormAssetCatalogDef,
    "priorityDefault" | "linkLabel" | "linkHref" | "isActive"
  > &
    Partial<
      Pick<
        FormAssetCatalogDef,
        "priorityDefault" | "linkLabel" | "linkHref" | "isActive"
      >
    >
): FormAssetCatalogDef {
  return {
    priorityDefault: "",
    linkLabel: "",
    linkHref: "",
    isActive: true,
    ...partial,
  };
}

export const BUILTIN_CATALOGS: Record<CatalogSection, FormAssetCatalogDef[]> = {
  digital: [
    D({
      id: "organicPosts",
      slug: "organicPosts",
      title: "Organic Post(s)",
      specs: "1080×1080, 1080×1350",
      notesDefault: "",
      notesPlaceholder: "Specs, copy, timing, or other details…",
      sortOrder: 10,
    }),
    D({
      id: "email",
      slug: "email",
      title: "Email",
      specs: "Main Module, Rich Image, Secondary Module (Static)",
      notesDefault: "",
      notesPlaceholder: "Notes for email creative…",
      priorityDefault:
        "Priority asset as we need to submit to Punchh 4 business days in advance",
      sortOrder: 20,
    }),
    D({
      id: "websiteCarousel",
      slug: "websiteCarousel",
      title: "Website Carousel",
      specs:
        "Static (unless noted otherwise), Save files as WebP Lossy 75 high",
      notesDefault: "",
      notesPlaceholder: "Specs, copy, timing, or other details…",
      sortOrder: 30,
    }),
    D({
      id: "smsCopy",
      slug: "smsCopy",
      title: "SMS Copy",
      specs: "160 character limit",
      notesDefault: "",
      notesPlaceholder: "160 character limit",
      sortOrder: 40,
    }),
    D({
      id: "whatsappCopy",
      slug: "whatsappCopy",
      title: "WhatsApp Copy",
      specs: "No character limit - cannot be segmented",
      notesDefault: "",
      notesPlaceholder: "No character limit - cannot be segmented",
      sortOrder: 50,
    }),
    D({
      id: "socialHeaders",
      slug: "socialHeaders",
      title: "Social Headers",
      specs: "Static (unless noted otherwise)",
      notesDefault: "",
      notesPlaceholder: "Specs, copy, timing, or other details…",
      sortOrder: 60,
    }),
  ],
  paid: [
    D({
      id: "metaPaidSocial",
      slug: "metaPaidSocial",
      title: "Meta Paid Social",
      specs: "1080×1080 / 1080×1920, Animated (unless noted otherwise)",
      notesDefault: `• Headline: 27 characters (including spaces)
• Primary text/body: 125 characters (including spaces)`,
      notesPlaceholder: "Headline / primary text copy…",
      priorityDefault: "Due to Tru 1 week early",
      sortOrder: 10,
    }),
    D({
      id: "pmaxGoogle",
      slug: "pmaxGoogle",
      title: "PMAX / Google",
      specs:
        "1200x1200; 1200x628, Optional 960x1200 - Animated (unless noted otherwise)",
      notesDefault: "",
      notesPlaceholder: "Specs, copy, timing…",
      priorityDefault: "Due to Tru 1 week early",
      sortOrder: 20,
    }),
    D({
      id: "tiktok",
      slug: "tiktok",
      title: "TikTok Paid Media",
      specs: "Primary text ≤100 characters",
      notesDefault: "Primary Text: 100 Characters",
      notesPlaceholder: "Primary text copy…",
      sortOrder: 30,
    }),
    D({
      id: "olvYoutube",
      slug: "olvYoutube",
      title: "OLV / YouTube",
      specs: "",
      notesDefault: `3 Short headlines:
• 30 characters max: • 30 characters max: • 15 characters max

1 Long headline:
• 90 characters max:

2 Description:
• 90 characters max: • 60 characters max

1 CTA`,
      notesPlaceholder: "Headlines, descriptions, CTA…",
      sortOrder: 40,
    }),
  ],
  physical: (
    [
      ["menuBoard", "Menu Board", "", 10],
      ["mtvScreen", "MTV Screen", "", 20],
      ["dtScreen", "DT Screen", "", 30],
      ["lto4thScreen", "LTO / 4th Screen", "", 40],
      ["bouncebackFront", "Bounceback (Front)", "", 50],
      ["bouncebackBack", "Bounceback (Back)", "", 60],
      ["bouncebackInstructions", "Bounceback Instruction Sheet", "", 70],
      ["windowClings", "Window Clings", "24×32 / 36×48", 80],
      ["doorClings", "Door Clings", "", 90],
      ["dtTopper", "DT Topper", "", 100],
      ["registerDangler", "Register Dangler", "", 110],
      ["resSign", "RES Sign", "", 120],
      ["counterCard", "Counter Card", "", 130],
      ["digitalAFrame", "Digital A Frame", "", 140],
      ["aFrame", "A Frame", "", 150],
      ["posOrderScreen", "POS Order Screen", "", 160],
      [
        "kioskHomepage",
        "Kiosk Homepage Screen / Menu Cover",
        "1080×1920 JPEG/GIF ≤20MB",
        170,
      ],
    ] as const
  ).map(([slug, title, specs, sortOrder]) =>
    D({
      id: slug,
      slug,
      title,
      specs,
      notesDefault: "",
      notesPlaceholder: "Production notes…",
      sortOrder,
    })
  ),
  pr: [
    D({
      id: "blogPost",
      slug: "blogPost",
      title: "Blog Post – Campero Website",
      specs: "",
      notesDefault: "",
      notesPlaceholder: "Description / notes for the blog post…",
      linkLabel: "Link to specs example files",
      linkHref:
        "https://www.dropbox.com/scl/fo/fkc1yxaywf20md6c9uaav/AFJUPGCH1u9-bhIGRW0vjxg?rlkey=gvlc3ojb5nuli8ibzddfcjblu&st=cnyiifzq&e=1&dl=0",
      sortOrder: 10,
    }),
    D({
      id: "pressRelease",
      slug: "pressRelease",
      title: "Press Release",
      specs: "Only needed if it will be on the wire",
      notesDefault: "",
      notesPlaceholder: "Description / notes for the press release…",
      sortOrder: 20,
    }),
  ],
};

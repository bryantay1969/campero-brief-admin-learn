import {
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  ShadingType,
} from "docx";
import type { PromoBrief } from "./types";
import { formatDateRange } from "./utils";
import { BRAND_GUIDELINES_PATH } from "./brandGuidelines";
import { formatDigitalAssetDetail } from "./digitalAssets";
import { formatITAssetDetail, IT_PROJECT_OWNER_NOTE } from "./itElements";
import { formatPaidMediaDetail, PAID_MEDIA_SPEC_SHEET } from "./paidMedia";
import {
  PR_BLOG_SPECS_LINK,
  PR_PRESS_RELEASE_SUBTITLE,
} from "./prAssets";

const ORANGE = "E85D04";
const MUTED = "78716C";
const DARK = "1C1917";
const LIGHT_LINE = "E7E5E4";
const SOFT_BG = "FAFAF9";

function dash(v?: string): string {
  return v && v.trim() ? v.trim() : "—";
}

function yesNo(v: string): string {
  return v === "yes" ? "Yes" : v === "no" ? "No" : "—";
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: ORANGE, space: 4 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
        color: ORANGE,
        font: "Calibri",
      }),
    ],
  });
}

function fieldRow(label: string, value: string): Paragraph[] {
  const lines = dash(value).split("\n");
  const paras: Paragraph[] = [];
  lines.forEach((line, i) => {
    paras.push(
      new Paragraph({
        spacing: { after: i === lines.length - 1 ? 60 : 20 },
        children:
          i === 0
            ? [
                new TextRun({
                  text: `${label}:  `,
                  bold: true,
                  size: 18,
                  color: MUTED,
                  font: "Calibri",
                }),
                new TextRun({
                  text: line || "—",
                  size: 18,
                  color: DARK,
                  font: "Calibri",
                }),
              ]
            : [
                new TextRun({
                  text: line,
                  size: 18,
                  color: DARK,
                  font: "Calibri",
                }),
              ],
      })
    );
  });
  return paras;
}

function checkItem(title: string, detail?: string): Paragraph {
  const body = detail ? `${title} — ${detail}` : title;
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: "☑  ",
        size: 18,
        color: ORANGE,
        font: "Calibri",
      }),
      new TextRun({
        text: body,
        bold: true,
        size: 18,
        color: DARK,
        font: "Calibri",
      }),
    ],
  });
}

function linkParagraph(
  label: string,
  url: string,
  prefix = ""
): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      ...(prefix
        ? [
            new TextRun({
              text: prefix,
              size: 18,
              color: DARK,
              font: "Calibri",
            }),
          ]
        : []),
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: label,
            style: "Hyperlink",
            color: ORANGE,
            bold: true,
            size: 18,
            font: "Calibri",
          }),
        ],
        link: url.startsWith("http") ? url : `https://${url}`,
      }),
    ],
  });
}

/**
 * Build and download a Word (.docx) of the promo brief.
 * Mirrors web preview / PDF: only enabled assets, same sections.
 */
export async function downloadBriefDocx(brief: PromoBrief): Promise<void> {
  const dateRange = formatDateRange(brief.launchDate, brief.endDate);
  const promoTitle = brief.promoName.trim() || "Untitled Promo";

  const digital = (brief.digitalAssets || []).filter((a) => a.enabled);
  const it = (Array.isArray(brief.itElements) ? brief.itElements : []).filter(
    (a) => a.enabled
  );
  const pm = (Array.isArray(brief.paidMedia) ? brief.paidMedia : []).filter(
    (a) => a.enabled
  );
  const pr = brief.pr;
  const prCustom = (Array.isArray(pr.custom) ? pr.custom : []).filter(
    (a) => a.enabled
  );
  const showPr =
    pr.blogPost.enabled || pr.pressRelease.enabled || prCustom.length > 0;
  const physical = (
    Array.isArray(brief.physicalAssets) ? brief.physicalAssets : []
  ).filter((a) => a.enabled);

  const photoItems = (
    Array.isArray(brief.foodPhotoReferences) ? brief.foodPhotoReferences : []
  ).filter((r) => (r.name || "").trim() || (r.link || "").trim());

  const brandGuidelinesUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${BRAND_GUIDELINES_PATH}`
      : BRAND_GUIDELINES_PATH;

  const children: (Paragraph | Table)[] = [];

  // Header band (simple table with orange fill)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: ORANGE },
              // ~0.25" inset so header copy isn’t flush to the edge
              margins: {
                top: 120,
                bottom: 120,
                left: 360,
                right: 360,
              },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [
                new Paragraph({
                  spacing: { before: 80, after: 40 },
                  children: [
                    new TextRun({
                      text: "POLLO CAMPERO  ·  MARKETING",
                      bold: true,
                      size: 16,
                      color: "FFFFFF",
                      font: "Calibri",
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: promoTitle,
                      bold: true,
                      size: 36,
                      color: "FFFFFF",
                      font: "Calibri",
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: "Promo Checklist Brief",
                      size: 22,
                      color: "FFFFFF",
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));

  // Overview
  children.push(sectionHeading("Promo Overview"));
  children.push(...fieldRow("Project Lead", brief.projectLead));
  children.push(...fieldRow("Promo Name", brief.promoName));
  children.push(...fieldRow("Dates", dateRange));
  children.push(...fieldRow("Project Description", brief.quickNote));
  children.push(...fieldRow("Loyalty only", yesNo(brief.loyaltyOnly)));
  children.push(...fieldRow("Promo code", yesNo(brief.promoCodeNeeded)));
  children.push(...fieldRow("Locations", brief.locations));

  // Messaging
  children.push(sectionHeading("Messaging & Creative Direction"));
  children.push(...fieldRow("Messaging", brief.messagingBullets));
  children.push(...fieldRow("Creative notes", brief.creativeNotes));

  if (photoItems.length === 0) {
    children.push(...fieldRow("Photo/asset refs", "—"));
  } else {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "Photo/asset refs:",
            bold: true,
            size: 18,
            color: MUTED,
            font: "Calibri",
          }),
        ],
      })
    );
    for (const r of photoItems) {
      const name = (r.name || "").trim() || "Untitled reference";
      const link = (r.link || "").trim();
      if (link) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${name} · `,
                bold: true,
                size: 18,
                color: DARK,
                font: "Calibri",
              }),
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: "click here",
                    style: "Hyperlink",
                    color: ORANGE,
                    bold: true,
                    size: 18,
                    font: "Calibri",
                  }),
                ],
                link: link.startsWith("http") ? link : `https://${link}`,
              }),
            ],
          })
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: name,
                bold: true,
                size: 18,
                color: DARK,
                font: "Calibri",
              }),
            ],
          })
        );
      }
    }
  }

  if (digital.length > 0) {
    children.push(sectionHeading("Digital Assets"));
    for (const a of digital) {
      children.push(
        checkItem(a.title || "Untitled", formatDigitalAssetDetail(a) || undefined)
      );
    }
  }

  if (it.length > 0) {
    children.push(sectionHeading("IT / Online Ordering"));
    for (const a of it) {
      children.push(
        checkItem(a.title || "Untitled", formatITAssetDetail(a) || undefined)
      );
    }
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: IT_PROJECT_OWNER_NOTE,
            italics: true,
            size: 16,
            color: MUTED,
            font: "Calibri",
          }),
        ],
      })
    );
  }

  if (pm.length > 0) {
    children.push(sectionHeading("Paid Media"));
    children.push(
      linkParagraph(PAID_MEDIA_SPEC_SHEET.label, PAID_MEDIA_SPEC_SHEET.href)
    );
    for (const a of pm) {
      children.push(
        checkItem(a.title || "Untitled", formatPaidMediaDetail(a) || undefined)
      );
    }
  }

  if (showPr) {
    children.push(sectionHeading("PR"));
    if (pr.blogPost.enabled) {
      children.push(
        checkItem(
          "Blog Post – Campero Website",
          `${PR_BLOG_SPECS_LINK.label}${pr.blogPost.notes ? ` · ${pr.blogPost.notes}` : ""}`
        )
      );
      children.push(
        linkParagraph(PR_BLOG_SPECS_LINK.label, PR_BLOG_SPECS_LINK.href)
      );
    }
    if (pr.pressRelease.enabled) {
      children.push(
        checkItem(
          "Press Release – By SPM",
          `${PR_PRESS_RELEASE_SUBTITLE}${pr.pressRelease.notes ? ` · ${pr.pressRelease.notes}` : ""}`
        )
      );
    }
    for (const a of prCustom) {
      children.push(
        checkItem(
          a.title || "Untitled PR item",
          [a.specs, a.notes].filter((p) => p && String(p).trim()).join(" · ") ||
            undefined
        )
      );
    }
  }

  if (physical.length > 0) {
    children.push(sectionHeading("Physical / In-Store Assets"));
    for (const a of physical) {
      children.push(
        checkItem(
          a.label || "Untitled",
          [a.specs, a.notes].filter((p) => p && String(p).trim()).join(" · ") ||
            undefined
        )
      );
    }
  }

  children.push(sectionHeading("Legal"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: SOFT_BG },
              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: LIGHT_LINE,
                },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: LIGHT_LINE,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: LIGHT_LINE,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: LIGHT_LINE,
                },
              },
              children: dash(brief.legal.legalText)
                .split("\n")
                .map(
                  (line) =>
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: line || " ",
                          size: 17,
                          color: DARK,
                          font: "Calibri",
                        }),
                      ],
                    })
                ),
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: "Brand guidelines",
              style: "Hyperlink",
              color: ORANGE,
              bold: true,
              size: 18,
              font: "Calibri",
            }),
          ],
          link: brandGuidelinesUrl,
        }),
        new TextRun({
          text: " — product naming, logo, drinks, and other fixed brand rules",
          size: 16,
          color: MUTED,
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: `Generated ${new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}  ·  Campero Brief Builder`,
          size: 14,
          color: MUTED,
          font: "Calibri",
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "Campero Brief Builder",
    title: promoTitle,
    description: "Pollo Campero promo checklist brief",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (brief.promoName || "promo-brief")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const filename = `campero-promo-brief-${safeName || "draft"}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

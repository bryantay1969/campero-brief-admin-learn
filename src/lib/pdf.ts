import type { PromoBrief } from "./types";
import { formatDateRange, formatPhotoRefs } from "./utils";
import { BRAND_GUIDELINES_PATH } from "./brandGuidelines";
import { formatDigitalAssetDetail } from "./digitalAssets";
import { formatITAssetDetail, IT_PROJECT_OWNER_NOTE } from "./itElements";
import { formatPaidMediaDetail, PAID_MEDIA_SPEC_SHEET } from "./paidMedia";
import {
  PR_BLOG_SPECS_LINK,
  PR_PRESS_RELEASE_SUBTITLE,
} from "./prAssets";

/**
 * Professional multi-page PDF built with jsPDF text/drawing APIs.
 * Layout mirrors the web BriefPreview (header, labeled rows, checkbox lists).
 */
export async function downloadBriefPdf(brief: PromoBrief): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 48;
  const marginBottom = 52;
  const contentWidth = pageWidth - marginX * 2;
  /** Match web preview ~140px label column at letter scale */
  const labelWidth = 120;
  const valueGap = 10;
  const valueWidth = contentWidth - labelWidth - valueGap;

  // Brand palette (hex only — fully supported)
  const orange: [number, number, number] = [232, 93, 4];
  const amber: [number, number, number] = [244, 140, 6];
  const yellow: [number, number, number] = [255, 186, 8];
  const dark: [number, number, number] = [28, 25, 23];
  const muted: [number, number, number] = [120, 113, 108];
  const lightLine: [number, number, number] = [231, 229, 228];
  const softBg: [number, number, number] = [250, 250, 249];
  const stoneBorder: [number, number, number] = [214, 211, 209];
  const mutedText: [number, number, number] = [168, 162, 158];

  let y = marginTop;
  let pageNum = 1;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      drawFooter();
      pdf.addPage();
      pageNum += 1;
      y = marginTop;
      drawContinuationHeader();
    }
  };

  const drawFooter = () => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...muted);
    pdf.text("Campero Promo Brief Builder", marginX, pageHeight - 28);
    pdf.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 28, {
      align: "right",
    });
  };

  const drawContinuationHeader = () => {
    pdf.setFillColor(...orange);
    pdf.rect(0, 0, pageWidth, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(
      `${brief.promoName.trim() || "Promo Brief"} (continued)`,
      marginX,
      28
    );
    y = 44;
  };

  const yesNo = (v: string) =>
    v === "yes" ? "Yes" : v === "no" ? "No" : "—";

  const textOrDash = (v?: string) => (v && v.trim() ? v.trim() : "—");

  /**
   * Checkbox matching web preview: square with border;
   * filled orange + white check when on.
   * `top` is the top edge of the box (not text baseline).
   */
  const drawCheckbox = (left: number, top: number, on: boolean, size = 10) => {
    const r = 1.5;
    if (on) {
      pdf.setFillColor(...orange);
      pdf.setDrawColor(...orange);
      pdf.setLineWidth(0.6);
      pdf.roundedRect(left, top, size, size, r, r, "FD");

      // White checkmark (two strokes)
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(1.5);
      pdf.setLineCap("round");
      pdf.setLineJoin("round");
      const x1 = left + size * 0.22;
      const y1 = top + size * 0.52;
      const x2 = left + size * 0.42;
      const y2 = top + size * 0.7;
      const x3 = left + size * 0.78;
      const y3 = top + size * 0.28;
      pdf.line(x1, y1, x2, y2);
      pdf.line(x2, y2, x3, y3);
    } else {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...stoneBorder);
      pdf.setLineWidth(0.9);
      pdf.roundedRect(left, top, size, size, r, r, "FD");
    }
  };

  // ——— Header banner (matches web preview gradient band) ———
  const headerH = 92;
  pdf.setFillColor(...orange);
  pdf.rect(0, 0, pageWidth, headerH, "F");
  pdf.setFillColor(...amber);
  pdf.rect(pageWidth * 0.55, 0, pageWidth * 0.25, headerH, "F");
  pdf.setFillColor(...yellow);
  pdf.rect(pageWidth * 0.8, 0, pageWidth * 0.2, headerH, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("POLLO CAMPERO  ·  MARKETING", marginX, 28);
  pdf.setFontSize(22);
  pdf.text(brief.promoName.trim() || "Untitled Promo", marginX, 52);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text("Promo Checklist Brief", marginX, 72);

  y = headerH + 20;

  // ——— Helpers ———
  const FONT = 9;
  const LINE_H = 12;
  const ROW_PAD_Y = 5;

  const sectionTitle = (title: string) => {
    ensureSpace(36);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...orange);
    pdf.text(title.toUpperCase(), marginX, y);
    y += 5;
    pdf.setDrawColor(...orange);
    pdf.setLineWidth(1.2);
    // Softer full-width rule under section (like web border-b-2)
    pdf.setDrawColor(232, 93, 4);
    pdf.setLineWidth(1.5);
    const ruleW = Math.min(contentWidth, 220);
    pdf.line(marginX, y, marginX + ruleW, y);
    // light remainder of line
    pdf.setDrawColor(254, 215, 170); // orange-200-ish
    pdf.setLineWidth(1);
    pdf.line(marginX + ruleW, y, marginX + contentWidth, y);
    y += 12;
  };

  /**
   * Label | value row with a clean full-width hairline under the whole block.
   * Line is drawn only after text is placed so it never overlaps copy.
   */
  const row = (label: string, value: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(FONT);
    const lines = pdf.splitTextToSize(
      textOrDash(value),
      valueWidth
    ) as string[];
    const textBlockH = Math.max(LINE_H, lines.length * LINE_H);
    const blockH = ROW_PAD_Y + textBlockH + ROW_PAD_Y;

    ensureSpace(blockH + 2);

    // First line baseline: top padding + ~0.75 of font size for cap height
    const baseline = y + ROW_PAD_Y + FONT * 0.85;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(FONT);
    pdf.setTextColor(...muted);
    pdf.text(label, marginX, baseline);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...dark);
    let lineBaseline = baseline;
    for (const line of lines) {
      pdf.text(line, marginX + labelWidth + valueGap, lineBaseline);
      lineBaseline += LINE_H;
    }

    // Advance past text + padding, then draw separator under the block
    y += blockH;
    pdf.setDrawColor(...lightLine);
    pdf.setLineWidth(0.5);
    pdf.line(marginX, y, marginX + contentWidth, y);
  };

  /**
   * Checklist row: drawn checkbox + title (+ optional detail), web-preview style.
   */
  const checkLine = (on: boolean, title: string, detail?: string) => {
    const box = 10;
    const boxGap = 8;
    const textLeft = marginX + box + boxGap;
    const textW = contentWidth - box - boxGap;
    const full = detail ? `${title} — ${detail}` : title;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(FONT);
    const lines = pdf.splitTextToSize(full, textW) as string[];
    const padY = 3;
    const textBlockH = Math.max(box, lines.length * LINE_H);
    const blockH = padY + textBlockH + padY;

    ensureSpace(blockH);

    drawCheckbox(marginX, y + padY + 1, on, box);

    const textColor: [number, number, number] = on ? dark : mutedText;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(FONT);

    let lineBaseline = y + padY + FONT * 0.85;
    lines.forEach((line, i) => {
      // First line bold (asset name), continuation normal — mirrors web weight
      pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
      pdf.text(line, textLeft, lineBaseline);
      lineBaseline += LINE_H;
    });

    y += blockH;
  };

  // ——— Content (match web preview: only checked assets / hide empty sections) ———
  const dateRange = formatDateRange(brief.launchDate, brief.endDate);

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

  sectionTitle("Promo Overview");
  row("Project Lead", brief.projectLead);
  row("Promo Name", brief.promoName);
  row("Dates", dateRange);
  row("Project Description", brief.quickNote);
  row("Loyalty only", yesNo(brief.loyaltyOnly));
  row("Promo code", yesNo(brief.promoCodeNeeded));
  row("Locations", brief.locations);

  sectionTitle("Messaging & Creative Direction");
  row("Messaging", brief.messagingBullets);
  row("Creative notes", brief.creativeNotes);
  row("Photo/asset refs", formatPhotoRefs(brief.foodPhotoReferences));

  if (digital.length > 0) {
    sectionTitle("Digital Assets");
    digital.forEach((a) => {
      const detail = formatDigitalAssetDetail(a);
      checkLine(true, a.title || "Untitled", detail || undefined);
    });
  }

  if (it.length > 0) {
    sectionTitle("IT / Online Ordering");
    it.forEach((a) => {
      const detail = formatITAssetDetail(a);
      checkLine(true, a.title || "Untitled", detail || undefined);
    });
    ensureSpace(28);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(...muted);
    const noteLines = pdf.splitTextToSize(
      IT_PROJECT_OWNER_NOTE,
      contentWidth
    ) as string[];
    pdf.text(noteLines, marginX, y + 8);
    y += noteLines.length * 11 + 10;
  }

  if (pm.length > 0) {
    sectionTitle("Paid Media");
    ensureSpace(20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...orange);
    pdf.textWithLink(PAID_MEDIA_SPEC_SHEET.label, marginX, y + 8, {
      url: PAID_MEDIA_SPEC_SHEET.href,
    });
    y += 16;
    pm.forEach((a) => {
      const detail = formatPaidMediaDetail(a);
      checkLine(true, a.title || "Untitled", detail || undefined);
    });
  }

  if (showPr) {
    sectionTitle("PR");
    if (pr.blogPost.enabled) {
      checkLine(
        true,
        "Blog Post – Campero Website",
        `${PR_BLOG_SPECS_LINK.label}${pr.blogPost.notes ? ` · ${pr.blogPost.notes}` : ""}`
      );
      ensureSpace(14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...orange);
      pdf.textWithLink(PR_BLOG_SPECS_LINK.label, marginX + 18, y + 6, {
        url: PR_BLOG_SPECS_LINK.href,
      });
      y += 14;
    }
    if (pr.pressRelease.enabled) {
      checkLine(
        true,
        "Press Release – By SPM",
        `${PR_PRESS_RELEASE_SUBTITLE}${pr.pressRelease.notes ? ` · ${pr.pressRelease.notes}` : ""}`
      );
    }
    prCustom.forEach((a) => {
      checkLine(
        true,
        a.title || "Untitled PR item",
        [a.specs, a.notes].filter((p) => p && String(p).trim()).join(" · ") ||
          undefined
      );
    });
  }

  if (physical.length > 0) {
    sectionTitle("Physical / In-Store Assets");
    physical.forEach((a) => {
      checkLine(
        true,
        a.label || "Untitled",
        [a.specs, a.notes].filter((p) => p && String(p).trim()).join(" · ") ||
          undefined
      );
    });
  }

  sectionTitle("Legal");
  ensureSpace(40);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  const legalLines = pdf.splitTextToSize(
    textOrDash(brief.legal.legalText),
    contentWidth - 16
  ) as string[];
  const legalPad = 10;
  const legalLineH = 11;
  const legalBoxH = legalPad * 2 + legalLines.length * legalLineH;
  ensureSpace(legalBoxH + 30);

  const boxTop = y;
  pdf.setFillColor(...softBg);
  pdf.setDrawColor(...lightLine);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(marginX, boxTop, contentWidth, legalBoxH, 4, 4, "FD");

  pdf.setTextColor(...dark);
  let legalY = boxTop + legalPad + 8;
  for (const line of legalLines) {
    pdf.text(line, marginX + 8, legalY);
    legalY += legalLineH;
  }
  y = boxTop + legalBoxH + 12;

  // Brand guidelines link (absolute URL so PDF opens correctly)
  const brandGuidelinesUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${BRAND_GUIDELINES_PATH}`
      : BRAND_GUIDELINES_PATH;

  ensureSpace(28);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...orange);
  pdf.textWithLink("Brand guidelines", marginX, y + 8, {
    url: brandGuidelinesUrl,
  });
  const linkW = pdf.getTextWidth("Brand guidelines");
  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text(
    " — product naming, logo, drinks, and other fixed brand rules",
    marginX + linkW + 2,
    y + 8
  );
  y += 18;

  ensureSpace(16);
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text(
    `Generated ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
    marginX,
    y + 8
  );

  drawFooter();

  const safeName = (brief.promoName || "promo-brief")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  pdf.save(`campero-promo-brief-${safeName || "draft"}.pdf`);
}

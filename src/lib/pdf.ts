import type { PromoBrief } from "./types";
import { formatDateRange, formatPhotoRefs } from "./utils";
import { getCopyrightLine } from "./legalTemplates";
import { formatDigitalAssetDetail } from "./digitalAssets";
import { formatITAssetDetail, IT_PROJECT_OWNER_NOTE } from "./itElements";
import { formatPaidMediaDetail, PAID_MEDIA_SPEC_SHEET } from "./paidMedia";
import {
  PR_BLOG_SPECS_LINK,
  PR_PRESS_RELEASE_SUBTITLE,
} from "./prAssets";

/**
 * Professional multi-page PDF built with jsPDF text/drawing APIs.
 * Avoids html2canvas (which fails on Tailwind v4 lab()/oklch() colors).
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
  const labelWidth = 118;
  const valueWidth = contentWidth - labelWidth - 8;

  // Brand palette (hex only — fully supported)
  const orange: [number, number, number] = [232, 93, 4];
  const amber: [number, number, number] = [244, 140, 6];
  const yellow: [number, number, number] = [255, 186, 8];
  const dark: [number, number, number] = [28, 25, 23];
  const muted: [number, number, number] = [120, 113, 108];
  const lightLine: [number, number, number] = [231, 229, 228];
  const softBg: [number, number, number] = [250, 250, 249];

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
      `${brief.promoName || "Promo Brief"} (continued)`,
      marginX,
      28
    );
    y = 44;
  };

  const yesNo = (v: string) =>
    v === "yes" ? "Yes" : v === "no" ? "No" : "—";

  const textOrDash = (v?: string) => (v && v.trim() ? v.trim() : "—");

  // ——— Header banner ———
  pdf.setFillColor(...orange);
  pdf.rect(0, 0, pageWidth, 92, "F");
  // subtle right accent
  pdf.setFillColor(...amber);
  pdf.rect(pageWidth * 0.55, 0, pageWidth * 0.25, 92, "F");
  pdf.setFillColor(...yellow);
  pdf.rect(pageWidth * 0.8, 0, pageWidth * 0.2, 92, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("POLLO CAMPERO  ·  MARKETING", marginX, 28);
  pdf.setFontSize(22);
  pdf.text("Promo Checklist Brief", marginX, 52);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(brief.promoName || "Untitled Promo", marginX, 72);

  y = 112;

  // ——— Helpers ———
  const sectionTitle = (title: string) => {
    ensureSpace(36);
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...orange);
    pdf.text(title.toUpperCase(), marginX, y);
    y += 4;
    pdf.setDrawColor(...orange);
    pdf.setLineWidth(1.2);
    pdf.line(marginX, y, marginX + contentWidth, y);
    y += 14;
  };

  const row = (label: string, value: string) => {
    const lines = pdf.splitTextToSize(textOrDash(value), valueWidth) as string[];
    const blockH = Math.max(14, lines.length * 12 + 4);
    ensureSpace(blockH + 2);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(label, marginX, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...dark);
    pdf.text(lines, marginX + labelWidth, y);

    y += blockH;
    pdf.setDrawColor(...lightLine);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, y - 4, marginX + contentWidth, y - 4);
  };

  const checkLine = (on: boolean, title: string, detail?: string) => {
    const mark = on ? "[x]" : "[ ]";
    const full = detail ? `${title} — ${detail}` : title;
    const lines = pdf.splitTextToSize(full, contentWidth - 28) as string[];
    const blockH = Math.max(14, lines.length * 11 + 2);
    ensureSpace(blockH);

    const checkColor: [number, number, number] = on
      ? dark
      : muted;
    const textColor: [number, number, number] = on
      ? dark
      : [168, 162, 158];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(checkColor[0], checkColor[1], checkColor[2]);
    pdf.text(mark, marginX, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text(lines, marginX + 24, y);
    y += blockH;
  };

  const bulletList = (items: string[]) => {
    const cleaned = items.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      row("Messaging", "None");
      return;
    }
    ensureSpace(18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text("Messaging", marginX, y);
    y += 12;

    cleaned.forEach((item) => {
      const lines = pdf.splitTextToSize(`•  ${item}`, contentWidth - 8) as string[];
      ensureSpace(lines.length * 12 + 2);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...dark);
      pdf.setFontSize(9);
      pdf.text(lines, marginX + 4, y);
      y += lines.length * 12 + 2;
    });
    pdf.setDrawColor(...lightLine);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, y, marginX + contentWidth, y);
    y += 8;
  };

  // ——— Content ———
  const dateRange = formatDateRange(brief.launchDate, brief.endDate);

  const digital = brief.digitalAssets;
  const it = Array.isArray(brief.itElements) ? brief.itElements : [];
  const pm = Array.isArray(brief.paidMedia) ? brief.paidMedia : [];
  const pr = brief.pr;

  sectionTitle("Promo Overview");
  row("Project Lead", brief.projectLead);
  row("Promo Name", brief.promoName);
  row("Dates", dateRange);
  row("Quick Note", brief.quickNote);
  row("Loyalty only", yesNo(brief.loyaltyOnly));
  row("Promo code", yesNo(brief.promoCodeNeeded));
  row("Locations", brief.locations);

  sectionTitle("Messaging & Creative Direction");
  bulletList(brief.messagingBullets.map((b) => b.text));
  row("Creative notes", brief.creativeNotes);
  row("Photo/asset refs", formatPhotoRefs(brief.foodPhotoReferences));

  sectionTitle("Digital Assets");
  if (digital.length === 0) {
    checkLine(false, "None listed");
  } else {
    digital.forEach((a) => {
      const detail = formatDigitalAssetDetail(a);
      checkLine(a.enabled, a.title || "Untitled", detail || undefined);
    });
  }

  sectionTitle("IT / Online Ordering");
  if (it.length === 0) {
    checkLine(false, "None listed");
  } else {
    it.forEach((a) => {
      const detail = formatITAssetDetail(a);
      checkLine(a.enabled, a.title || "Untitled", detail || undefined);
    });
  }
  ensureSpace(28);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  const noteLines = pdf.splitTextToSize(
    IT_PROJECT_OWNER_NOTE,
    contentWidth
  ) as string[];
  pdf.text(noteLines, marginX, y);
  y += noteLines.length * 11 + 6;

  sectionTitle("Paid Media");
  ensureSpace(20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...orange);
  pdf.textWithLink(PAID_MEDIA_SPEC_SHEET.label, marginX, y, {
    url: PAID_MEDIA_SPEC_SHEET.href,
  });
  y += 14;
  if (pm.length === 0) {
    checkLine(false, "None listed");
  } else {
    pm.forEach((a) => {
      const detail = formatPaidMediaDetail(a);
      checkLine(a.enabled, a.title || "Untitled", detail || undefined);
    });
  }

  sectionTitle("PR");
  checkLine(
    pr.blogPost.enabled,
    "Blog Post – Campero Website",
    `${PR_BLOG_SPECS_LINK.label}${pr.blogPost.notes ? ` · ${pr.blogPost.notes}` : ""}`
  );
  if (pr.blogPost.enabled) {
    ensureSpace(14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...orange);
    pdf.textWithLink(PR_BLOG_SPECS_LINK.label, marginX + 24, y, {
      url: PR_BLOG_SPECS_LINK.href,
    });
    y += 12;
  }
  checkLine(
    pr.pressRelease.enabled,
    "Press Release – By SPM",
    `${PR_PRESS_RELEASE_SUBTITLE}${pr.pressRelease.notes ? ` · ${pr.pressRelease.notes}` : ""}`
  );

  sectionTitle("Physical / In-Store Assets");
  const physical = Array.isArray(brief.physicalAssets)
    ? brief.physicalAssets
    : [];
  if (physical.length === 0) {
    checkLine(false, "None listed");
  } else {
    physical.forEach((a) => {
      checkLine(
        a.enabled,
        a.label || "Untitled",
        [a.specs, a.notes].filter((p) => p && String(p).trim()).join(" · ") ||
          undefined
      );
    });
  }

  sectionTitle("Legal");
  ensureSpace(40);
  const legalLines = pdf.splitTextToSize(
    textOrDash(brief.legal.legalText),
    contentWidth - 16
  ) as string[];
  const legalBoxH = legalLines.length * 11 + 20;
  ensureSpace(legalBoxH + 30);

  pdf.setFillColor(...softBg);
  pdf.setDrawColor(...lightLine);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(marginX, y - 8, contentWidth, legalBoxH, 4, 4, "FD");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...dark);
  pdf.text(legalLines, marginX + 8, y + 6);
  y += legalBoxH + 12;

  const copyright = getCopyrightLine(
    brief.legal.copyrightVariant,
    brief.legal.copyrightYear
  );
  ensureSpace(24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  const copyLines = pdf.splitTextToSize(copyright, contentWidth) as string[];
  pdf.text(copyLines, marginX, y);
  y += copyLines.length * 11 + 8;

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
    y
  );

  drawFooter();

  const safeName = (brief.promoName || "promo-brief")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  pdf.save(`campero-promo-brief-${safeName || "draft"}.pdf`);
}

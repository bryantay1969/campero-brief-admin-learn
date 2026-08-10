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

function yesNo(v: string): string {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return "—";
}

function check(enabled: boolean): string {
  return enabled ? "☑" : "☐";
}

export function briefToMarkdown(brief: PromoBrief): string {
  const dateRange = formatDateRange(brief.launchDate, brief.endDate);

  const bullets = brief.messagingBullets
    .filter((b) => b.text.trim())
    .map((b) => `- ${b.text}`)
    .join("\n");

  const digital = brief.digitalAssets;
  const it = Array.isArray(brief.itElements) ? brief.itElements : [];
  const pm = Array.isArray(brief.paidMedia) ? brief.paidMedia : [];
  const pr = brief.pr;

  const digitalLines = digital
    .map((a) => {
      const detail = formatDigitalAssetDetail(a);
      return `- ${check(a.enabled)} **${a.title || "Untitled"}**${detail ? ` — ${detail}` : ""}`;
    })
    .join("\n");

  const itLines = it
    .map((a) => {
      const detail = formatITAssetDetail(a);
      return `- ${check(a.enabled)} **${a.title || "Untitled"}**${detail ? ` — ${detail}` : ""}`;
    })
    .join("\n");

  const paidLines = pm
    .map((a) => {
      const detail = formatPaidMediaDetail(a);
      return `- ${check(a.enabled)} **${a.title || "Untitled"}**${detail ? ` — ${detail}` : ""}`;
    })
    .join("\n");

  const physical = (Array.isArray(brief.physicalAssets)
    ? brief.physicalAssets
    : []
  )
    .map((a) => {
      const parts = [a.specs, a.notes].filter((p) => p && String(p).trim());
      return `- ${check(a.enabled)} **${a.label || "Untitled"}**${parts.length ? ` — ${parts.join(" · ")}` : ""}`;
    })
    .join("\n");

  const copyright = getCopyrightLine(
    brief.legal.copyrightVariant,
    brief.legal.copyrightYear
  );

  return `# Marketing Promo Checklist Brief

## Promo Overview

| Field | Value |
| --- | --- |
| Project Lead | ${brief.projectLead || "—"} |
| Promo / Initiative Name | ${brief.promoName || "—"} |
| Dates | ${dateRange} |
| Quick Note | ${brief.quickNote || "—"} |
| Loyalty only | ${yesNo(brief.loyaltyOnly)} |
| Promo code needed | ${yesNo(brief.promoCodeNeeded)} |
| Locations | ${brief.locations || "—"} |

## Messaging & Creative Direction

### Messaging
${bullets || "_None_"}

### Creative Notes / Food Direction
${brief.creativeNotes || "_None_"}

### Photography/Asset References
${formatPhotoRefs(brief.foodPhotoReferences) || "_None_"}

## Digital Assets

${digitalLines || "_None_"}

## IT / Online Ordering Assets

${itLines || "_None_"}

_${IT_PROJECT_OWNER_NOTE}_

## Paid Media

[Spec sheet: ${PAID_MEDIA_SPEC_SHEET.label}](${PAID_MEDIA_SPEC_SHEET.href})

${paidLines || "_None_"}

## PR

- ${check(pr.blogPost.enabled)} **Blog Post – Campero Website** — [${PR_BLOG_SPECS_LINK.label}](${PR_BLOG_SPECS_LINK.href})${pr.blogPost.notes ? ` — ${pr.blogPost.notes}` : ""}
- ${check(pr.pressRelease.enabled)} **Press Release – By SPM** — ${PR_PRESS_RELEASE_SUBTITLE}${pr.pressRelease.notes ? ` — ${pr.pressRelease.notes}` : ""}

## Physical / In-Store Assets

${physical}

## Legal

${brief.legal.legalText}

${copyright}
`;
}

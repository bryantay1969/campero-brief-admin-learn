"use client";

import type { PromoBrief } from "@/lib/types";
import { formatDateRange, formatPhotoRefs } from "@/lib/utils";
import { BRAND_GUIDELINES_PATH } from "@/lib/brandGuidelines";
import { formatDigitalAssetDetail } from "@/lib/digitalAssets";
import { formatITAssetDetail, IT_PROJECT_OWNER_NOTE } from "@/lib/itElements";
import {
  formatPaidMediaDetail,
  PAID_MEDIA_SPEC_SHEET,
} from "@/lib/paidMedia";
import {
  PR_BLOG_SPECS_LINK,
  PR_PRESS_RELEASE_SUBTITLE,
} from "@/lib/prAssets";

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={
        on
          ? "inline-flex size-4 shrink-0 items-center justify-center rounded border border-campero-orange bg-campero-orange text-white text-[10px] font-bold leading-none"
          : "inline-flex size-4 shrink-0 items-center justify-center rounded border border-stone-300 bg-white text-transparent text-[10px] leading-none"
      }
    >
      ✓
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 border-b border-stone-100 text-[12px] leading-snug">
      <div className="font-semibold text-stone-500">{label}</div>
      <div className="text-stone-900 whitespace-pre-wrap">
        {children || "—"}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-campero-orange border-b-2 border-campero-orange/30 pb-1">
      {children}
    </h3>
  );
}

function AssetLine({
  on,
  title,
  detail,
}: {
  on: boolean;
  title: string;
  detail?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1 text-[12px] leading-snug">
      <span className="mt-0.5">
        <Check on={on} />
      </span>
      <div className={on ? "text-stone-900" : "text-stone-400"}>
        <span className="font-semibold">{title}</span>
        {detail && <span className="text-stone-600"> — {detail}</span>}
      </div>
    </div>
  );
}

export function BriefPreview({ brief }: { brief: PromoBrief }) {
  const dateRange = formatDateRange(brief.launchDate, brief.endDate);

  // Only include checked/enabled assets; hide whole sections when empty
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
  return (
    <article
      id="brief-preview"
      className="bg-white text-stone-900 shadow-xl border border-stone-200 rounded-lg overflow-hidden"
      style={{ width: "100%", maxWidth: 816 }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-[#E85D04] via-[#F48C06] to-[#FFBA08] px-8 py-6 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">
          Pollo Campero · Marketing
        </p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {brief.promoName.trim() || "Untitled Promo"}
        </h1>
        <p className="text-sm mt-1 opacity-95 font-medium">
          Promo Checklist Brief
        </p>
      </header>

      <div className="px-8 py-6">
        {/* Overview */}
        <SectionTitle>Promo Overview</SectionTitle>
        <Row label="Project Lead">{brief.projectLead}</Row>
        <Row label="Promo Name">{brief.promoName}</Row>
        <Row label="Dates">{dateRange}</Row>
        <Row label="Project Description">{brief.quickNote}</Row>
        <Row label="Loyalty only">
          {brief.loyaltyOnly === "yes"
            ? "Yes"
            : brief.loyaltyOnly === "no"
              ? "No"
              : "—"}
        </Row>
        <Row label="Promo code">
          {brief.promoCodeNeeded === "yes"
            ? "Yes"
            : brief.promoCodeNeeded === "no"
              ? "No"
              : "—"}
        </Row>
        <Row label="Locations">{brief.locations}</Row>

        {/* Messaging */}
        <SectionTitle>Messaging & Creative Direction</SectionTitle>
        <Row label="Messaging">{brief.messagingBullets}</Row>
        <Row label="Creative notes">{brief.creativeNotes}</Row>
        <Row label="Photo/asset refs">
          {formatPhotoRefs(brief.foodPhotoReferences)}
        </Row>
        {/* Digital — only when at least one asset is checked */}
        {digital.length > 0 && (
          <>
            <SectionTitle>Digital Assets</SectionTitle>
            {digital.map((a) => (
              <AssetLine
                key={a.id}
                on
                title={a.title || "Untitled"}
                detail={formatDigitalAssetDetail(a) || undefined}
              />
            ))}
          </>
        )}

        {/* IT — only when at least one asset is checked */}
        {it.length > 0 && (
          <>
            <SectionTitle>IT / Online Ordering</SectionTitle>
            {it.map((a) => (
              <AssetLine
                key={a.id}
                on
                title={a.title || "Untitled"}
                detail={formatITAssetDetail(a) || undefined}
              />
            ))}
            <p className="mt-2 text-[10px] text-stone-500 italic leading-relaxed">
              {IT_PROJECT_OWNER_NOTE}
            </p>
          </>
        )}

        {/* Paid — only when at least one asset is checked */}
        {pm.length > 0 && (
          <>
            <SectionTitle>Paid Media</SectionTitle>
            <p className="mb-2 text-[11px]">
              <a
                href={PAID_MEDIA_SPEC_SHEET.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-campero-orange underline"
              >
                {PAID_MEDIA_SPEC_SHEET.label}
              </a>
            </p>
            {pm.map((a) => (
              <AssetLine
                key={a.id}
                on
                title={a.title || "Untitled"}
                detail={formatPaidMediaDetail(a) || undefined}
              />
            ))}
          </>
        )}

        {/* PR — only when at least one item is checked */}
        {showPr && (
          <>
            <SectionTitle>PR</SectionTitle>
            {pr.blogPost.enabled && (
              <AssetLine
                on
                title="Blog Post – Campero Website"
                detail={
                  <>
                    <a
                      href={PR_BLOG_SPECS_LINK.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-campero-orange underline font-semibold"
                    >
                      {PR_BLOG_SPECS_LINK.label}
                    </a>
                    {pr.blogPost.notes ? ` · ${pr.blogPost.notes}` : ""}
                  </>
                }
              />
            )}
            {pr.pressRelease.enabled && (
              <AssetLine
                on
                title="Press Release – By SPM"
                detail={
                  pr.pressRelease.notes
                    ? `${PR_PRESS_RELEASE_SUBTITLE} · ${pr.pressRelease.notes}`
                    : PR_PRESS_RELEASE_SUBTITLE
                }
              />
            )}
            {prCustom.map((a) => (
              <AssetLine
                key={a.id}
                on
                title={a.title || "Untitled PR item"}
                detail={
                  [a.specs, a.notes]
                    .filter((p) => p && String(p).trim())
                    .join(" · ") || undefined
                }
              />
            ))}
          </>
        )}

        {/* Physical / In-Store — only when at least one asset is checked */}
        {physical.length > 0 && (
          <>
            <SectionTitle>Physical / In-Store Assets</SectionTitle>
            <div className="grid grid-cols-1 gap-0.5">
              {physical.map((a) => (
                <AssetLine
                  key={a.id}
                  on
                  title={a.label || "Untitled"}
                  detail={
                    [a.specs, a.notes]
                      .filter((p) => p && String(p).trim())
                      .join(" · ") || undefined
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Legal */}
        <SectionTitle>Legal</SectionTitle>
        <p className="text-[11px] leading-relaxed text-stone-700 whitespace-pre-wrap border border-stone-200 rounded-md p-3 bg-stone-50">
          {brief.legal.legalText}
        </p>
        <p className="mt-3 text-[11px]">
          <a
            href={BRAND_GUIDELINES_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-campero-orange underline"
          >
            Brand guidelines
          </a>
          <span className="text-stone-500">
            {" "}
            — product naming, logo, drinks, and other fixed brand rules
          </span>
        </p>
      </div>

      <footer className="px-8 py-3 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-400 flex justify-between">
        <span>Campero Promo Brief Builder</span>
        <span>
          Generated{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </footer>
    </article>
  );
}

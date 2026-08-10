"use client";

import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextArea,
} from "@/components/ui/FormControls";
import {
  PR_BLOG_SPECS_LINK,
  PR_PRESS_RELEASE_SUBTITLE,
} from "@/lib/prAssets";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export function PRSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const pr = brief.pr;

  const update = <K extends keyof typeof pr>(
    key: K,
    value: (typeof pr)[K]
  ) => {
    patch("pr", { ...pr, [key]: value });
  };

  return (
    <SectionCard id="section-pr" title="PR">
      <div className="space-y-3">
        {/* Blog Post */}
        <div
          className={cn(
            "rounded-xl border p-4 transition-colors",
            pr.blogPost.enabled
              ? "border-campero-orange/40 bg-orange-50/40"
              : "border-stone-200 bg-white"
          )}
        >
          <div className="flex items-start gap-3">
            <input
              id="pr-blog"
              type="checkbox"
              checked={pr.blogPost.enabled}
              onChange={(e) =>
                update("blogPost", {
                  ...pr.blogPost,
                  enabled: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange"
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor="pr-blog"
                className="block text-sm font-semibold text-stone-900 cursor-pointer"
              >
                Blog Post – Campero Website
              </label>
              <a
                href={PR_BLOG_SPECS_LINK.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-campero-orange hover:text-campero-orange-dark hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {PR_BLOG_SPECS_LINK.label}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </div>
          </div>
          {pr.blogPost.enabled && (
            <div className="mt-3 ml-7 space-y-3 border-t border-stone-100 pt-3">
              <div>
                <FieldLabel htmlFor="pr-blog-desc">Description</FieldLabel>
                <TextArea
                  id="pr-blog-desc"
                  value={pr.blogPost.notes}
                  onChange={(e) =>
                    update("blogPost", {
                      ...pr.blogPost,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Blog details, timing, image notes…"
                  className="min-h-[72px]"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Press Release */}
        <div
          className={cn(
            "rounded-xl border p-4 transition-colors",
            pr.pressRelease.enabled
              ? "border-campero-orange/40 bg-orange-50/40"
              : "border-stone-200 bg-white"
          )}
        >
          <div className="flex items-start gap-3">
            <input
              id="pr-press"
              type="checkbox"
              checked={pr.pressRelease.enabled}
              onChange={(e) =>
                update("pressRelease", {
                  ...pr.pressRelease,
                  enabled: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange"
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor="pr-press"
                className="block text-sm font-semibold text-stone-900 cursor-pointer"
              >
                Press Release – By SPM
              </label>
              <span className="block text-xs text-stone-500 mt-0.5">
                {PR_PRESS_RELEASE_SUBTITLE}
              </span>
            </div>
          </div>
          {pr.pressRelease.enabled && (
            <div className="mt-3 ml-7 space-y-3 border-t border-stone-100 pt-3">
              <div>
                <FieldLabel htmlFor="pr-press-desc">Description</FieldLabel>
                <TextArea
                  id="pr-press-desc"
                  value={pr.pressRelease.notes}
                  onChange={(e) =>
                    update("pressRelease", {
                      ...pr.pressRelease,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Wire timing, messaging, contacts…"
                  className="min-h-[72px]"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

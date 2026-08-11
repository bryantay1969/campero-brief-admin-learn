"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextArea,
} from "@/components/ui/FormControls";
import type { FormAssetCatalogDef } from "@/lib/formAssetCatalog";
import { BUILTIN_CATALOGS } from "@/lib/formAssetCatalogBuiltins";
import { fetchCatalogForForm } from "@/lib/supabase/formAssetCatalogApi";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export function PRSection() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const { canEdit, canAdmin } = useAuth();
  const pr = brief.pr;

  const [catalog, setCatalog] = useState<FormAssetCatalogDef[]>(
    BUILTIN_CATALOGS.pr
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const list = await fetchCatalogForForm("pr");
        if (cancelled) return;
        setCatalog(list);
        setSource(list.some((t) => t.dbId) ? "cloud" : "builtin");
        const current = useBriefStore.getState().brief.pr;
        const blogCat = list.find((c) => c.slug === "blogPost");
        const pressCat = list.find((c) => c.slug === "pressRelease");
        const next = {
          blogPost: {
            ...current.blogPost,
            notes: current.blogPost.notes.trim()
              ? current.blogPost.notes
              : blogCat?.notesDefault || current.blogPost.notes,
            imageSpecs:
              blogCat?.linkLabel ||
              current.blogPost.imageSpecs ||
              "",
          },
          pressRelease: {
            ...current.pressRelease,
            notes: current.pressRelease.notes.trim()
              ? current.pressRelease.notes
              : pressCat?.notesDefault || current.pressRelease.notes,
          },
        };
        // Only patch if empty notes filled from catalog
        if (
          next.blogPost.notes !== current.blogPost.notes ||
          next.blogPost.imageSpecs !== current.blogPost.imageSpecs ||
          next.pressRelease.notes !== current.pressRelease.notes
        ) {
          useBriefStore.getState().patch("pr", next);
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const blog = useMemo(
    () => catalog.find((c) => c.slug === "blogPost"),
    [catalog]
  );
  const press = useMemo(
    () => catalog.find((c) => c.slug === "pressRelease"),
    [catalog]
  );

  const update = <K extends keyof typeof pr>(
    key: K,
    value: (typeof pr)[K]
  ) => {
    patch("pr", { ...pr, [key]: value });
  };

  return (
    <SectionCard id="section-pr" title="PR">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="text-xs text-stone-500">
          {loadingCatalog
            ? "Loading catalog…"
            : source === "cloud"
              ? "Shared catalog"
              : "Built-in catalog"}
        </p>
        {canAdmin && (
          <Link
            href="/admin/catalog/pr/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage PR assets
          </Link>
        )}
      </div>

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
              disabled={!canEdit}
              onChange={(e) =>
                update("blogPost", {
                  ...pr.blogPost,
                  enabled: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange disabled:opacity-50"
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor="pr-blog"
                className="block text-sm font-semibold text-stone-900 cursor-pointer"
              >
                {blog?.title || "Blog Post – Campero Website"}
              </label>
              {blog?.specs?.trim() && (
                <span className="block text-xs text-stone-500 mt-0.5">
                  {blog.specs}
                </span>
              )}
              {(blog?.linkHref || blog?.linkLabel) && (
                <a
                  href={blog.linkHref || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-campero-orange hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {blog.linkLabel || "Specs link"}
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                </a>
              )}
            </div>
          </div>
          {pr.blogPost.enabled && (
            <div className="mt-3 ml-7 space-y-3 border-t border-stone-100 pt-3">
              <div>
                <FieldLabel htmlFor="pr-blog-desc">Description</FieldLabel>
                <TextArea
                  id="pr-blog-desc"
                  value={pr.blogPost.notes}
                  disabled={!canEdit}
                  onChange={(e) =>
                    update("blogPost", {
                      ...pr.blogPost,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    blog?.notesPlaceholder ||
                    "Blog details, timing, image notes…"
                  }
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
              disabled={!canEdit}
              onChange={(e) =>
                update("pressRelease", {
                  ...pr.pressRelease,
                  enabled: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange disabled:opacity-50"
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor="pr-press"
                className="block text-sm font-semibold text-stone-900 cursor-pointer"
              >
                {press?.title || "Press Release"}
              </label>
              <span className="block text-xs text-stone-500 mt-0.5">
                {press?.specs || "Only needed if it will be on the wire"}
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
                  disabled={!canEdit}
                  onChange={(e) =>
                    update("pressRelease", {
                      ...pr.pressRelease,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    press?.notesPlaceholder ||
                    "Wire timing, messaging, contacts…"
                  }
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

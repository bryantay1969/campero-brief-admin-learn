"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBriefStore } from "@/store/briefStore";
import type { ITAssetItem } from "@/lib/types";
import {
  BUILTIN_IT_CATALOG,
  createITAsset,
  isCustomITAsset,
  IT_PROJECT_OWNER_NOTE,
  mergeITElementsWithCatalog,
  type ITCatalogDef,
} from "@/lib/itElements";
import { fetchITCatalogForForm } from "@/lib/supabase/itAssetCatalogApi";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  SectionCard,
  FieldLabel,
  TextArea,
} from "@/components/ui/FormControls";
import { BriefOnlyAssetFields } from "@/components/ui/BriefOnlyAssetFields";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

export function ITElements() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const { canEdit, canAdmin, isViewer } = useAuth();
  const assets = Array.isArray(brief.itElements) ? brief.itElements : [];

  const [catalog, setCatalog] = useState<ITCatalogDef[]>(BUILTIN_IT_CATALOG);
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const setAssets = (next: ITAssetItem[]) => {
    patch("itElements", next);
  };

  // Load global catalog and merge into this brief’s IT list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const list = await fetchITCatalogForForm();
        if (cancelled) return;
        setCatalog(list);
        setSource(list.some((t) => t.dbId) ? "cloud" : "builtin");
        const current = useBriefStore.getState().brief.itElements;
        const currentList = Array.isArray(current) ? current : [];
        const merged = mergeITElementsWithCatalog(currentList, list);
        // Only write if structure/labels changed (avoid extra dirty churn when equal)
        const same =
          merged.length === currentList.length &&
          merged.every((m, i) => {
            const c = currentList[i];
            return (
              c &&
              c.id === m.id &&
              c.title === m.title &&
              c.specs === m.specs &&
              c.enabled === m.enabled &&
              c.notes === m.notes
            );
          });
        if (!same) {
          useBriefStore.getState().patch("itElements", merged);
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const placeholderById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of catalog) {
      map.set(c.slug, c.notesPlaceholder);
    }
    return map;
  }, [catalog]);

  const updateAsset = (
    id: string,
    updater: (a: ITAssetItem) => ITAssetItem
  ) => {
    setAssets(assets.map((a) => (a.id === id ? updater(a) : a)));
  };

  const removeAsset = (id: string) => {
    if (
      !window.confirm(
        "Remove this IT / OLO asset from the brief? You can add a new one anytime."
      )
    ) {
      return;
    }
    setAssets(assets.filter((a) => a.id !== id));
  };

  /** Brief-only custom asset (not from global catalog). */
  const addCustomAsset = () => {
    if (!canEdit) return;
    const item = createITAsset({
      title: "",
      specs: "",
      enabled: true,
      notes: "",
    });
    setAssets([...assets, item]);
  };

  return (
    <SectionCard id="section-it" title="IT / Online Ordering Assets">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">
            {assets.filter((a) => a.enabled).length} of {assets.length} selected
            {loadingCatalog
              ? " · Loading catalog…"
              : source === "cloud"
                ? " · Shared catalog"
                : " · Built-in catalog"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdmin && (
            <Link
              href="/admin/it/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage IT assets
            </Link>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={addCustomAsset}
              disabled={isViewer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add for this brief only
            </button>
          )}
        </div>
      </div>

      {canAdmin && (
        <p className="text-xs text-violet-900 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
          <strong>Admin:</strong> add or edit global IT assets (name, subtitle,
          description hint, and pre-filled text) under{" "}
          <Link href="/admin/it/" className="font-semibold underline">
            Manage IT assets
          </Link>
          . Those changes apply for everyone on new selections.
        </p>
      )}

      <div className="space-y-3">
        {assets.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            No IT assets yet.
            {canAdmin ? (
              <>
                {" "}
                <Link
                  href="/admin/it/"
                  className="font-semibold text-campero-orange hover:underline"
                >
                  Add global assets
                </Link>
              </>
            ) : (
              " Ask an admin to configure the IT catalog."
            )}
          </div>
        )}

        {assets.map((asset) => {
          const custom = isCustomITAsset(asset, catalog);
          const displayTitle =
            asset.title.trim() ||
            (custom ? "New IT asset" : "Untitled asset");
          const placeholder =
            placeholderById.get(asset.id) ||
            "Specs, copy, timing, or other details…";

          return (
            <div
              key={asset.id}
              className={cn(
                "rounded-xl border transition-colors",
                asset.enabled
                  ? "border-campero-orange/40 bg-orange-50/40"
                  : "border-stone-200 bg-white"
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asset.enabled}
                    disabled={!canEdit}
                    onChange={(e) =>
                      updateAsset(asset.id, (a) => ({
                        ...a,
                        enabled: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange disabled:opacity-50"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-900">
                      {displayTitle}
                    </span>
                    {asset.specs?.trim() && (
                      <span className="block text-xs text-stone-500 mt-0.5">
                        {asset.specs}
                      </span>
                    )}
                    {asset.priority?.trim() && (
                      <span className="mt-1 inline-block text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                        ⚡ {asset.priority}
                      </span>
                    )}
                    {(asset.linkHref || asset.linkLabel) && (
                      <a
                        href={asset.linkHref || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-campero-orange hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {asset.linkLabel || "Open link"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </label>
                {canEdit && custom && (
                  <button
                    type="button"
                    onClick={() => removeAsset(asset.id)}
                    className="shrink-0 rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50"
                    aria-label="Remove asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {asset.enabled && (
                <div className="border-t border-stone-100 px-4 py-4 space-y-3 ml-7">
                  {custom ? (
                    <BriefOnlyAssetFields
                      disabled={!canEdit}
                      value={{
                        name: asset.title,
                        specs: asset.specs,
                        priority: asset.priority || "",
                        linkLabel: asset.linkLabel || "",
                        linkHref: asset.linkHref || "",
                        notesPlaceholder: asset.notesPlaceholder || "",
                        notes: asset.notes,
                      }}
                      onChange={(v) =>
                        updateAsset(asset.id, (a) => ({
                          ...a,
                          title: v.name,
                          specs: v.specs,
                          priority: v.priority,
                          linkLabel: v.linkLabel,
                          linkHref: v.linkHref,
                          notesPlaceholder: v.notesPlaceholder,
                          notes: v.notes,
                        }))
                      }
                    />
                  ) : (
                    <div>
                      <FieldLabel htmlFor={`it-desc-${asset.id}`}>
                        Description
                      </FieldLabel>
                      <TextArea
                        id={`it-desc-${asset.id}`}
                        value={asset.notes}
                        disabled={!canEdit}
                        onChange={(e) =>
                          updateAsset(asset.id, (a) => ({
                            ...a,
                            notes: e.target.value,
                          }))
                        }
                        placeholder={placeholder}
                        className="min-h-[80px]"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-4 mt-1">
        {IT_PROJECT_OWNER_NOTE}
      </p>
    </SectionCard>
  );
}

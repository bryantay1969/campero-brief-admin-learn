"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBriefStore } from "@/store/briefStore";
import type { PhysicalAsset } from "@/lib/types";
import {
  createPhysicalAsset,
  isCustomPhysicalAsset,
  mergePhysicalAssetsWithCatalog,
} from "@/lib/defaults";
import type { FormAssetCatalogDef } from "@/lib/formAssetCatalog";
import { BUILTIN_CATALOGS } from "@/lib/formAssetCatalogBuiltins";
import { fetchCatalogForForm } from "@/lib/supabase/formAssetCatalogApi";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
} from "@/components/ui/FormControls";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

export function PhysicalAssets() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const { canEdit, canAdmin, isViewer } = useAuth();
  const assets = Array.isArray(brief.physicalAssets)
    ? brief.physicalAssets
    : [];
  const [catalog, setCatalog] = useState<FormAssetCatalogDef[]>(
    BUILTIN_CATALOGS.physical
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const list = await fetchCatalogForForm("physical");
        if (cancelled) return;
        setCatalog(list);
        setSource(list.some((t) => t.dbId) ? "cloud" : "builtin");
        const current = useBriefStore.getState().brief.physicalAssets;
        const currentList = Array.isArray(current) ? current : [];
        const merged = mergePhysicalAssetsWithCatalog(currentList, list);
        if (JSON.stringify(merged) !== JSON.stringify(currentList)) {
          useBriefStore.getState().patch("physicalAssets", merged);
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogSlugs = useMemo(
    () => new Set(catalog.map((c) => c.slug)),
    [catalog]
  );
  const placeholderById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of catalog) m.set(c.slug, c.notesPlaceholder);
    return m;
  }, [catalog]);

  const setAssets = (next: PhysicalAsset[]) => {
    patch("physicalAssets", next);
  };

  const updateAsset = (
    id: string,
    updater: (a: PhysicalAsset) => PhysicalAsset
  ) => {
    setAssets(assets.map((a) => (a.id === id ? updater(a) : a)));
  };

  const removeAsset = (id: string) => {
    if (
      !window.confirm(
        "Remove this in-store asset from the brief? You can add a new one anytime."
      )
    ) {
      return;
    }
    setAssets(assets.filter((a) => a.id !== id));
  };

  const addAsset = () => {
    if (!canEdit) return;
    setAssets([
      ...assets,
      createPhysicalAsset({ label: "", specs: "", enabled: true }),
    ]);
  };

  return (
    <SectionCard id="section-physical" title="Physical / In-Store Assets">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {assets.filter((a) => a.enabled).length} of {assets.length} selected
          {loadingCatalog
            ? " · Loading catalog…"
            : source === "cloud"
              ? " · Shared catalog"
              : " · Built-in catalog"}
        </p>
        <div className="flex flex-wrap gap-2">
          {canAdmin && (
            <Link
              href="/admin/catalog/physical/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage in-store assets
            </Link>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={addAsset}
              disabled={isViewer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white hover:bg-campero-orange-dark disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add for this brief only
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {assets.map((asset) => {
          const custom = isCustomPhysicalAsset(asset, catalogSlugs);
          const displayTitle =
            asset.label.trim() ||
            (custom ? "New in-store asset" : "Untitled asset");
          const placeholder =
            placeholderById.get(asset.id) || "Production notes…";

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
                  {custom && canEdit && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Name</FieldLabel>
                        <TextInput
                          value={asset.label}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              label: e.target.value,
                            }))
                          }
                          placeholder="e.g. Counter tent card"
                        />
                      </div>
                      <div>
                        <FieldLabel>Subtitle</FieldLabel>
                        <TextInput
                          value={asset.specs}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              specs: e.target.value,
                            }))
                          }
                          placeholder="e.g. 4×6, Full color"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextArea
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

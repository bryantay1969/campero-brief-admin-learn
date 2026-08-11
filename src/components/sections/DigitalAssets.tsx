"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBriefStore } from "@/store/briefStore";
import type { DigitalAssetField, DigitalAssetItem } from "@/lib/types";
import {
  createDigitalAsset,
  isCustomDigitalAsset,
  isEmailAsset,
  mergeDigitalWithCatalog,
  SMS_DESCRIPTION_PLACEHOLDER,
  WHATSAPP_DESCRIPTION_PLACEHOLDER,
} from "@/lib/digitalAssets";
import type { FormAssetCatalogDef } from "@/lib/formAssetCatalog";
import { BUILTIN_CATALOGS } from "@/lib/formAssetCatalogBuiltins";
import { fetchCatalogForForm } from "@/lib/supabase/formAssetCatalogApi";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
  Checkbox,
} from "@/components/ui/FormControls";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

export function DigitalAssets() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const { canEdit, canAdmin, isViewer } = useAuth();
  const assets = brief.digitalAssets;
  const [catalog, setCatalog] = useState<FormAssetCatalogDef[]>(
    BUILTIN_CATALOGS.digital
  );
  const [source, setSource] = useState<"cloud" | "builtin">("builtin");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const list = await fetchCatalogForForm("digital");
        if (cancelled) return;
        setCatalog(list);
        setSource(list.some((t) => t.dbId) ? "cloud" : "builtin");
        const current = useBriefStore.getState().brief.digitalAssets;
        const currentList = Array.isArray(current) ? current : [];
        const merged = mergeDigitalWithCatalog(currentList, list);
        if (JSON.stringify(merged) !== JSON.stringify(currentList)) {
          useBriefStore.getState().patch("digitalAssets", merged);
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

  const setAssets = (next: DigitalAssetItem[]) => {
    patch("digitalAssets", next);
  };

  const updateAsset = (
    id: string,
    updater: (a: DigitalAssetItem) => DigitalAssetItem
  ) => {
    setAssets(assets.map((a) => (a.id === id ? updater(a) : a)));
  };

  const removeAsset = (id: string) => {
    if (
      !window.confirm(
        "Remove this digital asset from the brief? You can add a new one anytime."
      )
    ) {
      return;
    }
    setAssets(assets.filter((a) => a.id !== id));
  };

  const addAsset = () => {
    const item = createDigitalAsset({
      title: "",
      specs: "",
      enabled: true,
      fields: [],
    });
    setAssets([...assets, item]);
  };

  const updateField = (
    assetId: string,
    fieldId: string,
    patchField: Partial<DigitalAssetField>
  ) => {
    updateAsset(assetId, (a) => ({
      ...a,
      fields: a.fields.map((f) =>
        f.id === fieldId ? { ...f, ...patchField } : f
      ),
    }));
  };

  return (
    <SectionCard id="section-digital" title="Digital Assets">
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
              href="/admin/catalog/digital/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage digital assets
            </Link>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={addAsset}
              disabled={isViewer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add for this brief only
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {assets.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            No digital assets yet.{" "}
            <button
              type="button"
              onClick={addAsset}
              className="font-semibold text-campero-orange hover:underline"
            >
              Add one
            </button>
          </div>
        )}

        {assets.map((asset) => {
          const email = isEmailAsset(asset);
          const custom = isCustomDigitalAsset(asset, catalogSlugs);
          const displayTitle =
            asset.title.trim() || (custom ? "New digital asset" : "Untitled asset");
          const descPlaceholder =
            placeholderById.get(asset.id) ||
            (asset.id === "smsCopy"
              ? SMS_DESCRIPTION_PLACEHOLDER
              : asset.id === "whatsappCopy"
                ? WHATSAPP_DESCRIPTION_PLACEHOLDER
                : "Specs, copy, timing, or other details…");

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
                    onChange={(e) =>
                      updateAsset(asset.id, (a) => ({
                        ...a,
                        enabled: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange"
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
                  {custom && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor={`title-${asset.id}`}>
                          Name
                        </FieldLabel>
                        <TextInput
                          id={`title-${asset.id}`}
                          value={asset.title}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              title: e.target.value,
                            }))
                          }
                          placeholder="e.g. Pinterest Pins"
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor={`specs-${asset.id}`}
                          hint="Small line under the name (sizes, format, etc.)"
                        >
                          Subtitle
                        </FieldLabel>
                        <TextInput
                          id={`specs-${asset.id}`}
                          value={asset.specs}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              specs: e.target.value,
                            }))
                          }
                          placeholder="e.g. 1080×1080, Static"
                        />
                      </div>
                    </div>
                  )}

                  {email && (
                    <div className="flex flex-wrap gap-4">
                      {asset.fields
                        .filter((f) => f.type === "checkbox")
                        .map((field) => (
                          <Checkbox
                            key={field.id}
                            id={`${asset.id}-${field.id}`}
                            checked={!!field.checked}
                            onChange={(v) =>
                              updateField(asset.id, field.id, {
                                checked: v,
                              })
                            }
                            label={field.label}
                          />
                        ))}
                    </div>
                  )}

                  <div>
                    <FieldLabel htmlFor={`desc-${asset.id}`}>
                      Description
                    </FieldLabel>
                    <TextArea
                      id={`desc-${asset.id}`}
                      value={asset.notes}
                      onChange={(e) =>
                        updateAsset(asset.id, (a) => ({
                          ...a,
                          notes: e.target.value,
                        }))
                      }
                      placeholder={descPlaceholder}
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

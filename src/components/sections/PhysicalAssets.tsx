"use client";

import { useBriefStore } from "@/store/briefStore";
import type { PhysicalAsset } from "@/lib/types";
import {
  createPhysicalAsset,
  isCustomPhysicalAsset,
} from "@/lib/defaults";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
} from "@/components/ui/FormControls";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export function PhysicalAssets() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const assets = Array.isArray(brief.physicalAssets)
    ? brief.physicalAssets
    : [];

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
    const item = createPhysicalAsset({
      label: "",
      specs: "",
      enabled: true,
    });
    setAssets([...assets, item]);
  };

  return (
    <SectionCard id="section-physical" title="Physical / In-Store Assets">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {assets.filter((a) => a.enabled).length} of {assets.length} selected
        </p>
        <button
          type="button"
          onClick={addAsset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Add in-store asset
        </button>
      </div>

      <div className="space-y-3">
        {assets.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            No in-store assets yet.{" "}
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
          const custom = isCustomPhysicalAsset(asset);
          const displayTitle =
            asset.label.trim() ||
            (custom ? "New in-store asset" : "Untitled asset");

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
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="shrink-0 rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Remove asset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {asset.enabled && (
                <div className="border-t border-stone-100 px-4 py-4 space-y-3 ml-7">
                  {custom && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor={`phys-title-${asset.id}`}>
                          Name
                        </FieldLabel>
                        <TextInput
                          id={`phys-title-${asset.id}`}
                          value={asset.label}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              label: e.target.value,
                            }))
                          }
                          placeholder="e.g. Table tent"
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor={`phys-specs-${asset.id}`}
                          hint="Small line under the name (sizes, format, etc.)"
                        >
                          Subtitle
                        </FieldLabel>
                        <TextInput
                          id={`phys-specs-${asset.id}`}
                          value={asset.specs}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              specs: e.target.value,
                            }))
                          }
                          placeholder="e.g. 24×36, 2-sided"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <FieldLabel htmlFor={`phys-desc-${asset.id}`}>
                      Description
                    </FieldLabel>
                    <TextArea
                      id={`phys-desc-${asset.id}`}
                      value={asset.notes}
                      onChange={(e) =>
                        updateAsset(asset.id, (a) => ({
                          ...a,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Production notes, quantities, markets, or other details…"
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

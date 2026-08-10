"use client";

import { useBriefStore } from "@/store/briefStore";
import type { PaidMediaAssetItem } from "@/lib/types";
import {
  createPaidMediaAsset,
  isCustomPaidMediaAsset,
  PAID_MEDIA_SPEC_SHEET,
} from "@/lib/paidMedia";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
} from "@/components/ui/FormControls";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

export function PaidMedia() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const assets = Array.isArray(brief.paidMedia) ? brief.paidMedia : [];

  const setAssets = (next: PaidMediaAssetItem[]) => {
    patch("paidMedia", next);
  };

  const updateAsset = (
    id: string,
    updater: (a: PaidMediaAssetItem) => PaidMediaAssetItem
  ) => {
    setAssets(assets.map((a) => (a.id === id ? updater(a) : a)));
  };

  const removeAsset = (id: string) => {
    if (
      !window.confirm(
        "Remove this paid media asset from the brief? You can add a new one anytime."
      )
    ) {
      return;
    }
    setAssets(assets.filter((a) => a.id !== id));
  };

  const addAsset = () => {
    const item = createPaidMediaAsset({
      title: "",
      specs: "",
      enabled: true,
    });
    setAssets([...assets, item]);
  };

  return (
    <SectionCard id="section-paid" title="Paid Media">
      <a
        href={PAID_MEDIA_SPEC_SHEET.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-campero-orange hover:text-campero-orange-dark hover:underline -mt-1 mb-1"
      >
        {PAID_MEDIA_SPEC_SHEET.label}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="sr-only">(opens in new tab)</span>
      </a>

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
          Add paid media asset
        </button>
      </div>

      <div className="space-y-3">
        {assets.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            No paid media assets yet.{" "}
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
          const custom = isCustomPaidMediaAsset(asset);
          const displayTitle =
            asset.title.trim() ||
            (custom ? "New paid media asset" : "Untitled asset");

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
                        <FieldLabel htmlFor={`pm-title-${asset.id}`}>
                          Name
                        </FieldLabel>
                        <TextInput
                          id={`pm-title-${asset.id}`}
                          value={asset.title}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              title: e.target.value,
                            }))
                          }
                          placeholder="e.g. Snapchat Ads"
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor={`pm-specs-${asset.id}`}
                          hint="Small line under the name (sizes, format, etc.)"
                        >
                          Subtitle
                        </FieldLabel>
                        <TextInput
                          id={`pm-specs-${asset.id}`}
                          value={asset.specs}
                          onChange={(e) =>
                            updateAsset(asset.id, (a) => ({
                              ...a,
                              specs: e.target.value,
                            }))
                          }
                          placeholder="e.g. 1080×1920, Animated"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <FieldLabel htmlFor={`pm-desc-${asset.id}`}>
                      Description
                    </FieldLabel>
                    <TextArea
                      id={`pm-desc-${asset.id}`}
                      value={asset.notes}
                      onChange={(e) =>
                        updateAsset(asset.id, (a) => ({
                          ...a,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Headlines, primary text, CTAs, timing, or other details…"
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

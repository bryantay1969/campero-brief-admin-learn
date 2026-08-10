import { clsx, type ClassValue } from "clsx";
import type { PhotoAssetReference } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Launch–end range for previews/exports (handles same-day and missing end). */
export function formatDateRange(launchDate: string, endDate: string): string {
  const start = formatDisplayDate(launchDate);
  if (!endDate || endDate === launchDate) return start;
  return `${start} – ${formatDisplayDate(endDate)}`;
}

/** Format photography/asset reference pairs for preview & export. */
export function formatPhotoRefs(
  refs: PhotoAssetReference[] | string | undefined | null
): string {
  if (!refs) return "";
  if (typeof refs === "string") return refs.trim();
  if (!Array.isArray(refs)) return "";
  return refs
    .map((r) => {
      const name = (r.name || "").trim();
      const link = (r.link || "").trim();
      if (name && link) return `${name}: ${link}`;
      return name || link;
    })
    .filter(Boolean)
    .join("; ");
}

export function charCount(value: string): number {
  return value?.length ?? 0;
}

export function charLimitClass(current: number, max: number): string {
  if (current > max) return "text-red-600 font-semibold";
  if (current > max * 0.9) return "text-amber-600 font-medium";
  return "text-stone-400";
}

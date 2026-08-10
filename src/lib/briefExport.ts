import type { PromoBrief, SavedBriefRecord } from "./types";
import { normalizeDigitalAssets } from "./digitalAssets";

function normalizeImportedBrief(brief: PromoBrief): PromoBrief {
  return {
    ...brief,
    digitalAssets: normalizeDigitalAssets(brief.digitalAssets),
  };
}

const EXPORT_VERSION = 1;

export interface BriefExportFile {
  type: "campero-promo-brief";
  version: number;
  exportedAt: string;
  name?: string;
  brief: PromoBrief;
}

export function buildExportPayload(
  brief: PromoBrief,
  name?: string
): BriefExportFile {
  return {
    type: "campero-promo-brief",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    name,
    brief,
  };
}

export function downloadBriefJson(brief: PromoBrief, name?: string): void {
  const payload = buildExportPayload(brief, name);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (name || brief.promoName || "promo-brief")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  a.href = url;
  a.download = `campero-brief-${safe || "export"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImportFile(raw: string): {
  name?: string;
  brief: PromoBrief;
} {
  const data = JSON.parse(raw) as unknown;

  // Full export wrapper
  if (
    data &&
    typeof data === "object" &&
    (data as BriefExportFile).type === "campero-promo-brief" &&
    (data as BriefExportFile).brief
  ) {
    const file = data as BriefExportFile;
    return { name: file.name, brief: normalizeImportedBrief(file.brief) };
  }

  // Library record shape
  if (
    data &&
    typeof data === "object" &&
    "brief" in data &&
    (data as SavedBriefRecord).brief
  ) {
    const rec = data as SavedBriefRecord;
    return { name: rec.name, brief: normalizeImportedBrief(rec.brief) };
  }

  // Bare PromoBrief
  if (
    data &&
    typeof data === "object" &&
    "promoName" in data &&
    "legal" in data
  ) {
    return { brief: normalizeImportedBrief(data as PromoBrief) };
  }

  throw new Error(
    "Unrecognized file. Export a brief JSON from this app and try again."
  );
}

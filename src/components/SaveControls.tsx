"use client";

import { useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import { defaultBriefName } from "@/lib/briefIds";
import { FolderOpen, Save } from "lucide-react";
import { format } from "date-fns";

export function SaveControls() {
  const brief = useBriefStore((s) => s.brief);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const isDirty = useBriefStore((s) => s.isDirty);
  const saveToLibrary = useBriefStore((s) => s.saveToLibrary);
  const setShowLibrary = useBriefStore((s) => s.setShowLibrary);
  const hydrated = useBriefStore((s) => s.hydrated);

  const [justSaved, setJustSaved] = useState(false);

  const active = library.find((b) => b.id === activeBriefId);

  const handleSave = () => {
    const saved = saveToLibrary(
      active?.name ||
        defaultBriefName(brief.promoName, brief.projectLead)
    );
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
    return saved;
  };

  if (!hydrated) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active ? (
        <span className="hidden md:inline-flex max-w-[200px] items-center gap-1.5 text-xs text-stone-500 truncate">
          <span
            className={
              isDirty
                ? "h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                : "h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
            }
          />
          <span className="truncate font-medium text-stone-700">
            {active.name}
          </span>
          {isDirty ? (
            <span className="text-amber-600 shrink-0">· edited</span>
          ) : brief.lastSaved ? (
            <span className="text-stone-400 shrink-0">
              · {format(new Date(brief.lastSaved), "h:mm a")}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-400">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
          Unsaved draft
        </span>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark"
      >
        <Save className="h-3.5 w-3.5" />
        {justSaved
          ? "Saved!"
          : activeBriefId
            ? isDirty
              ? "Save changes"
              : "Saved"
            : "Save brief"}
      </button>

      <button
        type="button"
        onClick={() => setShowLibrary(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-campero-orange/40 hover:bg-orange-50"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        My briefs
        {library.length > 0 && (
          <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
            {library.length}
          </span>
        )}
      </button>
    </div>
  );
}

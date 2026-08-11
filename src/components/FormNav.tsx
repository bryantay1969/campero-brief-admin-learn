"use client";

import { SECTIONS } from "@/lib/brandGuidelines";
import { sectionComplete } from "@/lib/sectionProgress";
import { useBriefStore } from "@/store/briefStore";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function FormNav() {
  const active = useBriefStore((s) => s.activeSection);
  const setActive = useBriefStore((s) => s.setActiveSection);
  const brief = useBriefStore((s) => s.brief);

  const activeIndex = SECTIONS.findIndex((s) => s.id === active);
  const progress = Math.round(((activeIndex + 1) / SECTIONS.length) * 100);

  return (
    <nav className="sticky top-[53px] z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-campero-orange">
              Progress
            </p>
            <p className="text-sm font-semibold text-stone-800 truncate">
              Step {activeIndex + 1} of {SECTIONS.length} ·{" "}
              {SECTIONS[activeIndex]?.shortLabel}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
            <div className="h-1.5 w-28 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-campero-orange to-campero-yellow transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress}%
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-thin">
          {SECTIONS.map((section, i) => {
            const isActive = section.id === active;
            const done = sectionComplete(section.id, brief) && !isActive;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-campero-orange text-white shadow-sm"
                    : done
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-stone-50 text-stone-600 border border-stone-200 hover:border-stone-300"
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                      isActive ? "bg-white/20" : "bg-stone-200 text-stone-600"
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                {section.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

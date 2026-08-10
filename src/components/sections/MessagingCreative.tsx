"use client";

import { useBriefStore } from "@/store/briefStore";
import type { PhotoAssetReference } from "@/lib/types";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
  DynamicList,
} from "@/components/ui/FormControls";
import { Plus, Trash2 } from "lucide-react";

function newRef(): PhotoAssetReference {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    link: "",
  };
}

export function MessagingCreative() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);

  const refs = Array.isArray(brief.foodPhotoReferences)
    ? brief.foodPhotoReferences
    : [newRef()];

  const setRefs = (next: PhotoAssetReference[]) => {
    patch("foodPhotoReferences", next);
  };

  const updateRef = (
    id: string,
    key: "name" | "link",
    value: string
  ) => {
    setRefs(
      refs.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const removeRef = (id: string) => {
    if (refs.length <= 1) {
      setRefs([{ ...newRef() }]);
      return;
    }
    setRefs(refs.filter((r) => r.id !== id));
  };

  return (
    <SectionCard
      id="section-messaging"
      title="Messaging & Creative Direction"
    >
      <div>
        <FieldLabel hint="Add or remove lines as needed">
          Messaging bullets
        </FieldLabel>
        <DynamicList
          items={brief.messagingBullets}
          onChange={(items) => patch("messagingBullets", items)}
          placeholder="Key message or talking point…"
          addLabel="Add messaging line"
        />
      </div>

      <div>
        <FieldLabel htmlFor="creativeNotes">
          Creative Notes / Food Direction
        </FieldLabel>
        <TextArea
          id="creativeNotes"
          value={brief.creativeNotes}
          onChange={(e) => patch("creativeNotes", e.target.value)}
          placeholder="Hero food styling, lighting, mood, do’s and don’ts…"
          className="min-h-[140px]"
          rows={5}
        />
      </div>

      <div>
        <FieldLabel hint="Name the asset and paste a drive/DAM/share link if available">
          Photography/Asset References
        </FieldLabel>
        <div className="space-y-2">
          {refs.map((ref, index) => (
            <div
              key={ref.id}
              className="flex flex-col sm:flex-row gap-2 rounded-xl border border-stone-200 bg-stone-50/40 p-3"
            >
              <span className="hidden sm:flex h-10 w-7 shrink-0 items-center justify-center text-xs font-semibold text-stone-400">
                {index + 1}.
              </span>
              <div className="flex-1 min-w-0 grid gap-2 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`ref-name-${ref.id}`}>Name</FieldLabel>
                  <TextInput
                    id={`ref-name-${ref.id}`}
                    value={ref.name}
                    onChange={(e) => updateRef(ref.id, "name", e.target.value)}
                    placeholder="e.g. Hero fried chicken still"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`ref-link-${ref.id}`}>Link</FieldLabel>
                  <TextInput
                    id={`ref-link-${ref.id}`}
                    type="url"
                    value={ref.link}
                    onChange={(e) => updateRef(ref.id, "link", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRef(ref.id)}
                className="shrink-0 self-end sm:self-center rounded-lg border border-stone-200 p-2 text-stone-400 hover:text-red-600 hover:border-red-200"
                aria-label="Remove reference"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRefs([...refs, newRef()])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-campero-orange hover:text-campero-orange-dark mt-1"
          >
            <Plus className="h-4 w-4" />
            Add reference
          </button>
        </div>
      </div>

    </SectionCard>
  );
}

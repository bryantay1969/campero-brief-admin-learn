"use client";

import { FieldLabel, TextArea, TextInput } from "@/components/ui/FormControls";

/** Same fields as admin global catalog forms, for brief-only custom assets. */
export type BriefOnlyAssetFieldsValue = {
  name: string;
  specs: string;
  priority: string;
  linkLabel: string;
  linkHref: string;
  notesPlaceholder: string;
  notes: string;
};

export function BriefOnlyAssetFields({
  value,
  onChange,
  disabled,
}: {
  value: BriefOnlyAssetFieldsValue;
  onChange: (next: BriefOnlyAssetFieldsValue) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<BriefOnlyAssetFieldsValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput
            value={value.name}
            disabled={disabled}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Checklist title"
          />
        </div>
        <div>
          <FieldLabel>Subtitle</FieldLabel>
          <TextInput
            value={value.specs}
            disabled={disabled}
            onChange={(e) => set({ specs: e.target.value })}
            placeholder="Line under the name (sizes, format…)"
          />
        </div>
      </div>
      <div>
        <FieldLabel>Priority callout</FieldLabel>
        <TextInput
          value={value.priority}
          disabled={disabled}
          onChange={(e) => set({ priority: e.target.value })}
          placeholder="Optional highlighted note (e.g. due early)"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Link label</FieldLabel>
          <TextInput
            value={value.linkLabel}
            disabled={disabled}
            onChange={(e) => set({ linkLabel: e.target.value })}
            placeholder="e.g. Spec sheet"
          />
        </div>
        <div>
          <FieldLabel>Link URL</FieldLabel>
          <TextInput
            value={value.linkHref}
            disabled={disabled}
            onChange={(e) => set({ linkHref: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>
      <div>
        <FieldLabel>Description hint</FieldLabel>
        <TextInput
          value={value.notesPlaceholder}
          disabled={disabled}
          onChange={(e) => set({ notesPlaceholder: e.target.value })}
          placeholder="Placeholder when description is empty"
        />
      </div>
      <div>
        <FieldLabel>Pre-filled description</FieldLabel>
        <TextArea
          value={value.notes}
          disabled={disabled}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder={
            value.notesPlaceholder.trim() ||
            "Default text for this asset on the brief"
          }
          className="min-h-[80px]"
          rows={3}
        />
      </div>
    </div>
  );
}

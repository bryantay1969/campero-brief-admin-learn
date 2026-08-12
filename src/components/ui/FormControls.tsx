"use client";

import { cn, charLimitClass } from "@/lib/utils";
import type { ReactNode } from "react";

export function FieldLabel({
  children,
  htmlFor,
  hint,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="text-sm font-semibold text-stone-800">
        {children}
        {required && <span className="text-campero-orange ml-0.5">*</span>}
      </span>
      {hint && (
        <span className="block text-xs text-stone-500 font-normal mt-0.5">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400",
        "focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20",
        "disabled:bg-stone-50 disabled:text-stone-400",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 min-h-[100px] resize-y",
        "focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20",
        className
      )}
      {...props}
    />
  );
}

export function CharCounter({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  const n = value?.length ?? 0;
  return (
    <span className={cn("text-xs tabular-nums", charLimitClass(n, max))}>
      {n}/{max}
    </span>
  );
}

export function ToggleYesNo({
  value,
  onChange,
  name,
}: {
  value: "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
  name: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
      {(
        [
          { v: "yes" as const, label: "Yes" },
          { v: "no" as const, label: "No" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.v}
          type="button"
          name={name}
          onClick={() => onChange(opt.v)}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
            value === opt.v
              ? "bg-campero-orange text-white shadow-sm"
              : "text-stone-600 hover:text-stone-900 hover:bg-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: string;
  id?: string;
}) {
  const cid = id || `cb-${String(label).slice(0, 20)}`;
  return (
    <label
      htmlFor={cid}
      className="flex items-start gap-3 cursor-pointer group"
    >
      <input
        id={cid}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-campero-orange focus:ring-campero-orange"
      />
      <span className="flex-1 min-w-0">
        <span className="text-sm font-medium text-stone-800 group-hover:text-stone-950">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-stone-500 mt-0.5">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function AssetCard({
  title,
  description,
  enabled,
  onToggle,
  children,
  priority,
}: {
  title: string;
  description?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: ReactNode;
  priority?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        enabled
          ? "border-campero-orange/40 bg-orange-50/40"
          : "border-stone-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Checkbox
          checked={enabled}
          onChange={onToggle}
          label={title}
          description={description}
          id={`asset-${title.replace(/\s+/g, "-").toLowerCase()}`}
        />
      </div>
      {priority && (
        <p className="mt-2 ml-7 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">
          ⚡ {priority}
        </p>
      )}
      {enabled && children && (
        <div className="mt-3 ml-7 space-y-3 border-t border-stone-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  headerActions,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  /** Optional controls aligned to the right of the title (e.g. Preview downloads). */
  headerActions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden"
    >
      <header className="border-b border-stone-100 bg-gradient-to-r from-orange-50/80 to-amber-50/40 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>
      <div className="p-5 sm:p-6 space-y-5">{children}</div>
    </section>
  );
}

export function NotesField({
  value,
  onChange,
  placeholder = "Notes…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>Notes</FieldLabel>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[72px]"
        rows={2}
      />
    </div>
  );
}



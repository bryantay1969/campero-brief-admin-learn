"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  FileStack,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared field styles for admin forms (match front-end inputs). */
export const adminFieldClass =
  "mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20";

export const adminLabelClass = "text-xs font-semibold text-stone-600";

export function AdminPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-stone-900">{children}</div>
  );
}

export function AdminHeader({
  title,
  subtitle,
  onRefresh,
  icon: Icon = FileStack,
}: {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <header className="border-b border-orange-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D04] to-[#FFBA08] text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white hover:bg-campero-orange-dark"
          >
            Back to brief
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AdminMain({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {children}
    </main>
  );
}

export function AdminFlash({
  message,
  error,
  sqlHint,
}: {
  message?: string | null;
  error?: string | null;
  sqlHint?: ReactNode;
}) {
  return (
    <>
      {message && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
          {error}
          {sqlHint}
        </p>
      )}
    </>
  );
}

export function AdminSectionHeader({
  title,
  count,
  loading,
  onAdd,
  addLabel = "Add for everyone",
}: {
  title: string;
  count: number;
  loading?: boolean;
  onAdd: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-bold text-sm text-stone-900">
        {title} ({loading ? "…" : count})
      </h2>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}

/** Front-end-matching list tile for admin catalog rows. */
export function AdminListTile({
  active = true,
  title,
  children,
  actions,
}: {
  active?: boolean;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        active
          ? "border-campero-orange/40 bg-orange-50/40"
          : "border-stone-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          {children}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-1.5 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function AdminInactiveBadge() {
  return (
    <span className="ml-2 text-[10px] font-bold uppercase text-stone-400">
      Inactive
    </span>
  );
}

export function AdminPriorityBadge({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 block w-fit text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
      ⚡ {children}
    </p>
  );
}

export function AdminItemActions({
  onEdit,
  onDelete,
  busy,
  deleteLabel = "Delete",
}: {
  onEdit: () => void;
  onDelete: () => void;
  busy?: boolean;
  deleteLabel?: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-900 hover:bg-violet-100"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" />
        {deleteLabel}
      </button>
    </>
  );
}

export function AdminModal({
  title,
  eyebrow,
  onClose,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden"
      >
        <div className="border-b border-campero-orange/30 bg-orange-50/80 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-campero-orange">
              {eyebrow}
            </p>
            <h3 className="font-bold text-stone-900 mt-0.5">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto flex-1">{children}</div>
        <div className="border-t border-stone-100 bg-stone-50 px-6 py-4 flex gap-2">
          {footer}
        </div>
      </form>
    </div>
  );
}

export function AdminModalSubmit({
  busy,
  isEdit,
}: {
  busy?: boolean;
  isEdit: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex-1 rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
    >
      {busy ? "Saving…" : isEdit ? "Save for everyone" : "Add for everyone"}
    </button>
  );
}

export function AdminModalCancel({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
    >
      Cancel
    </button>
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      {children}
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  createITCatalogItem,
  deleteITCatalogItem,
  fetchAllITCatalog,
  updateITCatalogItem,
  type ITCatalogRow,
} from "@/lib/supabase/itAssetCatalogApi";
import { FileStack, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

function emptyForm() {
  return {
    slug: "",
    title: "",
    specs: "",
    notes_default: "",
    notes_placeholder: "Specs, copy, timing, or other details…",
    priority_default: "",
    link_label: "",
    link_href: "",
    sort_order: 100,
    is_active: true,
  };
}

function slugFromTitle(title: string): string {
  const base = title
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return base || `itAsset${Date.now()}`;
}

function ITAdminPanel() {
  const [rows, setRows] = useState<ITCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllITCatalog();
      setRows(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load IT catalog. Did you run it-asset-catalog.sql?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3200);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
    setError(null);
  };

  const openEdit = (row: ITCatalogRow) => {
    setEditingId(row.id);
    setForm({
      slug: row.slug,
      title: row.title,
      specs: row.specs,
      notes_default: row.notes_default,
      notes_placeholder: row.notes_placeholder,
      priority_default: row.priority_default || "",
      link_label: row.link_label || "",
      link_href: row.link_href || "",
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateITCatalogItem(editingId, {
          title: form.title,
          specs: form.specs,
          notes_default: form.notes_default,
          notes_placeholder: form.notes_placeholder,
          priority_default: form.priority_default,
          link_label: form.link_label,
          link_href: form.link_href,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        flash(`Saved “${form.title}” for everyone`);
      } else {
        await createITCatalogItem({
          ...form,
          slug: form.slug.trim() || slugFromTitle(form.title),
        });
        flash(`Created “${form.title}” for everyone`);
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (row: ITCatalogRow) => {
    const ok = window.confirm(
      [
        `Delete IT asset “${row.title}” for EVERYONE?`,
        "",
        "This removes it from the global IT / OLO checklist for all users.",
        "Briefs that already include this asset keep their own copy until edited.",
      ].join("\n")
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await deleteITCatalogItem(row.id);
      if (editingId === row.id) closeForm();
      flash(`Deleted “${row.title}” for everyone`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-stone-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D04] to-[#FFBA08] text-white">
              <FileStack className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                IT / OLO assets
              </h1>
              <p className="text-xs text-stone-500">
                Global catalog · drives the IT tab checklist for everyone
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add asset for everyone
            </button>
            <Link
              href="/admin/legal/"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Legal
            </Link>
            <Link
              href="/admin/"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Users
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white hover:bg-campero-orange-dark"
            >
              Brief builder
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm text-sm text-violet-950">
          <p className="font-semibold">Shared IT / OLO checklist</p>
          <p className="mt-1 text-violet-900/90">
            Same options as other form catalogs: <strong>name</strong>,{" "}
            <strong>subtitle</strong>, <strong>priority callout</strong>,{" "}
            <strong>link label / URL</strong>, <strong>description hint</strong>
            , and <strong>pre-filled description</strong>. Changes apply the
            next time someone opens the IT tab.
          </p>
        </section>

        {message && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {error}
            {(error.includes("relation") ||
              error.includes("does not exist")) && (
              <span className="block mt-2 text-xs">
                Run <code>supabase/it-asset-catalog.sql</code> in the Supabase
                SQL Editor first.
              </span>
            )}
          </p>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={onSubmit}
              className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden"
            >
              <div
                className={
                  editingId
                    ? "border-b border-campero-orange/30 bg-orange-50 px-6 py-4"
                    : "border-b border-stone-100 bg-stone-50 px-6 py-4"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-campero-orange">
                      {editingId
                        ? "Edit global IT asset"
                        : "Add asset for everyone"}
                    </p>
                    <h3 className="text-base font-bold text-stone-900 mt-0.5">
                      {editingId
                        ? form.title || "Untitled asset"
                        : "New IT asset"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Updates the shared checklist for all users and new briefs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-1 text-stone-400 hover:text-stone-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Name (title)
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="e.g. OLO / Koala Image"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Subtitle
                  </label>
                  <input
                    value={form.specs}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, specs: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="Small line under the name (sizes, format…)"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Priority callout
                  </label>
                  <input
                    value={form.priority_default}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priority_default: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="Optional highlighted note"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Link label
                  </label>
                  <input
                    value={form.link_label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        link_label: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="e.g. Spec sheet"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Link URL
                  </label>
                  <input
                    value={form.link_href}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        link_href: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Description hint
                  </label>
                  <input
                    value={form.notes_placeholder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notes_placeholder: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="Shown as empty-field hint on the form"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Placeholder text when the description box is empty.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Pre-filled description
                  </label>
                  <textarea
                    value={form.notes_default}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notes_default: e.target.value,
                      }))
                    }
                    rows={6}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-serif leading-relaxed"
                    placeholder="Default text when this asset is added to a brief"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Used on new briefs and when the asset is first added.
                    Existing briefs keep their own description until edited.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-stone-600">
                      Sort order
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sort_order: Number(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-6">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          is_active: e.target.checked,
                        }))
                      }
                      className="rounded border-stone-300 text-campero-orange"
                    />
                    Active (show in form)
                  </label>
                </div>
              </div>
              <div className="border-t border-stone-100 bg-stone-50 px-6 py-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  {busy
                    ? "Saving…"
                    : editingId
                      ? "Save for everyone"
                      : "Add asset for everyone"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Assets ({rows.length})</h2>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-900 hover:bg-violet-100"
            >
              <Plus className="h-3 w-3" />
              Add asset for everyone
            </button>
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">
              No rows yet. Run <code>it-asset-catalog.sql</code> or click Add
              asset.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {rows.map((row) => (
                <li key={row.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          {row.title}
                        </span>
                        {!row.is_active && (
                          <span className="text-[10px] font-bold uppercase text-stone-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {row.specs && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {row.specs}
                        </p>
                      )}
                      {row.priority_default && (
                        <p className="mt-1 text-[11px] text-amber-800">
                          Priority: {row.priority_default}
                        </p>
                      )}
                      {(row.link_label || row.link_href) && (
                        <p className="mt-0.5 text-[11px] text-stone-500 truncate">
                          Link: {row.link_label || row.link_href}
                        </p>
                      )}
                      {row.notes_placeholder && (
                        <p className="mt-1 text-[11px] text-stone-400">
                          Hint: {row.notes_placeholder}
                        </p>
                      )}
                      {row.notes_default && (
                        <p className="mt-2 text-xs text-stone-600 line-clamp-2 font-serif whitespace-pre-wrap">
                          {row.notes_default}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-900 hover:bg-violet-100"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete for everyone
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminITPage() {
  return (
    <AdminGate>
      <ITAdminPanel />
    </AdminGate>
  );
}

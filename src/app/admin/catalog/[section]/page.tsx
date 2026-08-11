"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  CATALOG_SECTION_META,
  type CatalogSection,
} from "@/lib/formAssetCatalog";
import {
  createCatalogItem,
  deleteCatalogItem,
  fetchAllCatalog,
  updateCatalogItem,
  type FormAssetCatalogRow,
} from "@/lib/supabase/formAssetCatalogApi";
import { FileStack, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

const SECTIONS: CatalogSection[] = ["digital", "paid", "physical", "pr"];

function isSection(s: string): s is CatalogSection {
  return SECTIONS.includes(s as CatalogSection);
}

function emptyForm(section: CatalogSection) {
  return {
    slug: "",
    title: "",
    specs: "",
    notes_default: "",
    notes_placeholder:
      section === "physical"
        ? "Production notes…"
        : "Specs, copy, timing, or other details…",
    priority_default: "",
    link_label: "",
    link_href: "",
    sort_order: 100,
    is_active: true,
  };
}

function slugFromTitle(title: string): string {
  return (
    title
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "") || `asset${Date.now()}`
  );
}

function CatalogAdminPanel({ section }: { section: CatalogSection }) {
  const meta = CATALOG_SECTION_META[section];

  const [rows, setRows] = useState<FormAssetCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm(section));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAllCatalog(section));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load catalog. Did you run form-asset-catalogs.sql?"
      );
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3200);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(section));
    setShowForm(true);
    setError(null);
  };

  const openEdit = (row: FormAssetCatalogRow) => {
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
    setForm(emptyForm(section));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateCatalogItem(editingId, form);
        flash(`Saved “${form.title}” for everyone`);
      } else {
        await createCatalogItem(section, {
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

  const onDelete = async (row: FormAssetCatalogRow) => {
    if (
      !window.confirm(
        `Delete “${row.title}” for EVERYONE?\n\nRemoves it from the shared ${meta.formTab} checklist. Briefs that already use it keep their own copy.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteCatalogItem(row.id);
      flash(`Deleted “${row.title}”`);
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
              <h1 className="text-lg font-bold tracking-tight">{meta.label}</h1>
              <p className="text-xs text-stone-500">
                Global catalog · {meta.formTab} tab for everyone
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add for everyone
            </button>
            <Link
              href="/admin/it/"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              IT / OLO
            </Link>
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
              className="inline-flex items-center rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white"
            >
              Brief builder
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <Link
              key={s}
              href={`/admin/catalog/${s}/`}
              className={
                s === section
                  ? "rounded-full bg-campero-orange px-3 py-1.5 text-xs font-bold text-white"
                  : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              }
            >
              {CATALOG_SECTION_META[s].shortLabel}
            </Link>
          ))}
        </div>

        <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 text-sm text-violet-950">
          <p className="font-semibold">Shared checklist for {meta.formTab}</p>
          <p className="mt-1 text-violet-900/90">
            Same options on every catalog: <strong>name</strong>,{" "}
            <strong>subtitle</strong>, <strong>priority callout</strong>,{" "}
            <strong>link label / URL</strong>, <strong>description hint</strong>
            , and <strong>pre-filled description</strong>. Applies for everyone
            the next time they open the tab.
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
            {(error.includes("relation") || error.includes("does not exist")) && (
              <span className="block mt-2 text-xs">
                Run <code>supabase/form-asset-catalogs.sql</code> in Supabase
                first.
              </span>
            )}
          </p>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={onSubmit}
              className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border shadow-xl overflow-hidden"
            >
              <div className="border-b bg-orange-50/80 px-6 py-4 flex justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-campero-orange">
                    {editingId ? "Edit for everyone" : "Add for everyone"}
                  </p>
                  <h3 className="font-bold text-stone-900">
                    {editingId ? form.title || "Asset" : "New asset"}
                  </h3>
                </div>
                <button type="button" onClick={closeForm}>
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>
              <div className="p-6 space-y-3 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Name
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
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
                    placeholder="Line under the name"
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
                    placeholder="Optional highlighted note (e.g. due early)"
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
                  />
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
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
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
                  <label className="flex items-center gap-2 text-sm pt-6 font-medium">
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
                    Active
                  </label>
                </div>
              </div>
              <div className="border-t bg-stone-50 px-6 py-4 flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Saving…"
                    : editingId
                      ? "Save for everyone"
                      : "Add for everyone"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3 font-bold text-sm">
            Assets ({rows.length})
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">
              No rows. Run <code>form-asset-catalogs.sql</code> or add an asset.
            </p>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.id} className="px-5 py-4 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {row.title}
                      {!row.is_active && (
                        <span className="ml-2 text-[10px] uppercase text-stone-400">
                          Inactive
                        </span>
                      )}
                    </p>
                    {row.specs && (
                      <p className="text-xs text-stone-500">{row.specs}</p>
                    )}
                    {row.priority_default && (
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Priority: {row.priority_default}
                      </p>
                    )}
                    {(row.link_label || row.link_href) && (
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        Link: {row.link_label || row.link_href}
                      </p>
                    )}
                    {row.notes_default && (
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1 whitespace-pre-wrap">
                        {row.notes_default}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-900"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
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

export default function AdminCatalogSectionPage() {
  const params = useParams();
  const section = String(params?.section || "");
  const valid = useMemo(() => isSection(section), [section]);

  if (!valid) {
    return (
      <AdminGate>
        <div className="p-8 text-center text-sm text-stone-600">
          Unknown catalog section.{" "}
          <Link href="/admin/catalog/digital/" className="text-campero-orange font-semibold">
            Digital
          </Link>
        </div>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <CatalogAdminPanel section={section as CatalogSection} />
    </AdminGate>
  );
}

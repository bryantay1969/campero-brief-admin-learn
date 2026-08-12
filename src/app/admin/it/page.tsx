"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  AdminEmptyState,
  AdminFlash,
  AdminHeader,
  AdminInactiveBadge,
  AdminItemActions,
  AdminListTile,
  AdminMain,
  AdminPageShell,
  AdminPriorityBadge,
  AdminSectionHeader,
} from "@/components/admin/AdminUi";
import {
  createITCatalogItem,
  deleteITCatalogItem,
  fetchAllITCatalog,
  updateITCatalogItem,
  type ITCatalogRow,
} from "@/lib/supabase/itAssetCatalogApi";
import { X } from "lucide-react";

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
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(
        msg.includes("link_href") ||
          msg.includes("link_label") ||
          msg.includes("priority_default") ||
          msg.includes("PGRST204")
          ? `${msg}\n\nFix: In Supabase → SQL Editor, run the file supabase/catalog-fields-align.sql, then try Save again.`
          : msg
      );
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
    <AdminPageShell>
      <AdminHeader
        title="IT / OLO assets"
        subtitle="Global catalog · drives the IT tab checklist for everyone"
        onRefresh={() => void load()}
      />

      <AdminMain>
        <AdminFlash
          message={message}
          error={error}
          sqlHint={
            error &&
            (error.includes("relation") || error.includes("does not exist")) ? (
              <span className="block mt-2 text-xs">
                Run <code>supabase/it-asset-catalog.sql</code> in the Supabase
                SQL Editor first.
              </span>
            ) : null
          }
        />

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
                  <textarea
                    value={form.notes_placeholder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notes_placeholder: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm leading-relaxed"
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
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm leading-relaxed"
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

        <div className="space-y-3">
          <AdminSectionHeader
            title="Assets"
            count={rows.length}
            loading={loading}
            onAdd={openCreate}
          />
          <div className="space-y-3">
            {loading ? (
              <AdminEmptyState>Loading…</AdminEmptyState>
            ) : rows.length === 0 ? (
              <AdminEmptyState>
                No rows yet. Run <code>it-asset-catalog.sql</code> or click Add
                for everyone.
              </AdminEmptyState>
            ) : (
              rows.map((row) => (
                <AdminListTile
                  key={row.id}
                  active={row.is_active}
                  title={
                    <>
                      {row.title}
                      {!row.is_active && <AdminInactiveBadge />}
                    </>
                  }
                  actions={
                    <AdminItemActions
                      busy={busy}
                      onEdit={() => openEdit(row)}
                      onDelete={() => void onDelete(row)}
                    />
                  }
                >
                  {row.specs?.trim() && (
                    <p className="block text-xs text-stone-500 mt-0.5">
                      {row.specs}
                    </p>
                  )}
                  {row.priority_default?.trim() && (
                    <AdminPriorityBadge>
                      {row.priority_default}
                    </AdminPriorityBadge>
                  )}
                  {(row.link_label || row.link_href) && (
                    <p className="mt-1 text-xs font-semibold text-campero-orange truncate">
                      {row.link_label || row.link_href}
                    </p>
                  )}
                  {row.notes_placeholder?.trim() && (
                    <p className="mt-1 text-xs text-stone-400">
                      Hint: {row.notes_placeholder}
                    </p>
                  )}
                  {row.notes_default?.trim() && (
                    <p className="mt-2 text-xs text-stone-600 line-clamp-2 whitespace-pre-wrap">
                      {row.notes_default}
                    </p>
                  )}
                </AdminListTile>
              ))
            )}
          </div>
        </div>
      </AdminMain>
    </AdminPageShell>
  );
}

export default function AdminITPage() {
  return (
    <AdminGate>
      <ITAdminPanel />
    </AdminGate>
  );
}

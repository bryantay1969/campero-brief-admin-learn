"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  createLegalTemplate,
  deleteLegalTemplate,
  fetchAllLegalTemplates,
  updateLegalTemplate,
  type LegalTemplateRow,
} from "@/lib/supabase/legalTemplatesApi";
import { FileText, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";

function emptyForm() {
  return {
    slug: "",
    label: "",
    description: "",
    body: "",
    sort_order: 100,
    is_active: true,
  };
}

/** Internal id for briefs/DB — not shown in the UI. */
function slugFromLabel(label: string): string {
  const base = label
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return base || `template${Date.now()}`;
}

function LegalAdminPanel() {
  const [rows, setRows] = useState<LegalTemplateRow[]>([]);
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
      const data = await fetchAllLegalTemplates();
      setRows(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load templates. Did you run legal-templates.sql?"
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

  const openEdit = (row: LegalTemplateRow) => {
    setEditingId(row.id);
    setForm({
      slug: row.slug,
      label: row.label,
      description: row.description,
      body: row.body,
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
        await updateLegalTemplate(editingId, {
          label: form.label,
          description: form.description,
          body: form.body,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        flash(`Saved “${form.label}” for everyone`);
      } else {
        await createLegalTemplate({
          ...form,
          slug: slugFromLabel(form.label),
        });
        flash(`Created “${form.label}” for everyone`);
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (row: LegalTemplateRow) => {
    const ok = window.confirm(
      [
        `Delete template “${row.label}” for EVERYONE?`,
        "",
        "This removes the chip from the Legal tab for all users.",
        "It cannot be undone from this screen.",
        "",
        "Briefs that already saved this text keep their own copy. New briefs will no longer see this template.",
      ].join("\n")
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLegalTemplate(row.id);
      if (editingId === row.id) closeForm();
      flash(`Deleted “${row.label}” for everyone`);
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Manage all templates
              </h1>
              <p className="text-xs text-stone-500">
                Shared legal library · Legal tab chips for every user
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
              Add template for everyone
            </button>
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
          <p className="font-semibold">Shared library for everyone</p>
          <p className="mt-1 text-violet-900/90">
            <strong>Add template for everyone</strong> creates a new Legal chip
            for all users. Open a template and use{" "}
            <strong>Save for everyone</strong> to update the shared library. To
            change legal text on a single promo only, use{" "}
            <strong>Edit this brief</strong> on the Legal tab.
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
                Run <code>supabase/legal-templates.sql</code> in the Supabase
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
                        ? "Edit shared template"
                        : "Add template for everyone"}
                    </p>
                    <h3 className="text-base font-bold text-stone-900 mt-0.5">
                      {editingId
                        ? form.label || "Untitled template"
                        : "New template"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {editingId
                        ? "Save for everyone updates the shared library for all users and new briefs."
                        : "Creates a new shared chip on the Legal tab for all users."}
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
                    Label
                  </label>
                  <input
                    required
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="e.g. Standard"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Short description
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    placeholder="Shown under the chip label"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">
                    Legal text
                  </label>
                  <textarea
                    required
                    value={form.body}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, body: e.target.value }))
                    }
                    rows={8}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-serif leading-relaxed"
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
                  <Save className="h-4 w-4" />
                  {busy
                    ? "Saving…"
                    : editingId
                      ? "Save for everyone"
                      : "Add template for everyone"}
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
            <h2 className="text-sm font-bold">Templates ({rows.length})</h2>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-900 hover:bg-violet-100"
            >
              <Plus className="h-3 w-3" />
              Add template for everyone
            </button>
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">
              No rows yet. Run <code>legal-templates.sql</code> or click{" "}
              <strong>Add template for everyone</strong>.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {rows.map((row) => (
                <li key={row.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          {row.label}
                        </span>
                        {!row.is_active && (
                          <span className="text-[10px] font-bold uppercase text-stone-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {row.description && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {row.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-stone-600 line-clamp-2 font-serif">
                        {row.body}
                      </p>
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

export default function AdminLegalPage() {
  return (
    <AdminGate>
      <LegalAdminPanel />
    </AdminGate>
  );
}

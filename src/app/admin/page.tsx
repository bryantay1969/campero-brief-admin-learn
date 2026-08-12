"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/auth/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ProfileRow, UserRole } from "@/lib/supabase/adminApi";
import {
  apiCreateUser,
  apiDeleteUser,
  apiListUsers,
  apiUpdateUser,
} from "@/lib/supabase/adminClientApi";
import { format } from "date-fns";
import { Pencil, Plus, RefreshCw, Shield, Trash2, X } from "lucide-react";

const ROLES: UserRole[] = ["admin", "editor", "viewer"];

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case "admin":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "editor":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "viewer":
      return "bg-stone-100 text-stone-600 border-stone-200";
  }
}

function emptyCreate() {
  return {
    email: "",
    password: "",
    role: "editor" as UserRole,
    display_name: "",
  };
}

function AdminPanel() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);

  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    display_name: "",
    role: "editor" as UserRole,
    password: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await apiListUsers();
      setProfiles(rows);
    } catch (e) {
      // Fallback to direct select if API missing service role
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await apiCreateUser({
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        display_name: createForm.display_name || undefined,
      });
      setProfiles((prev) => [...prev, created]);
      setShowCreate(false);
      setCreateForm(emptyCreate());
      flash(`Created ${created.email}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (p: ProfileRow) => {
    setEditing(p);
    setEditForm({
      email: p.email || "",
      display_name: p.display_name || "",
      role: p.role,
      password: "",
    });
    setError(null);
  };

  const onEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      if (
        editing.id === user?.id &&
        editForm.role !== "admin" &&
        !window.confirm(
          "You are removing your own admin role. Continue?"
        )
      ) {
        setBusy(false);
        return;
      }

      const updated = await apiUpdateUser({
        id: editing.id,
        email: editForm.email,
        display_name: editForm.display_name,
        role: editForm.role,
        password: editForm.password || undefined,
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setEditing(null);
      flash(`Updated ${updated.email}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (p: ProfileRow) => {
    if (p.id === user?.id) {
      window.alert("You cannot delete your own account.");
      return;
    }
    if (
      !window.confirm(
        `Delete user “${p.email}”? They will no longer be able to log in. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiDeleteUser(p.id);
      setProfiles((prev) => prev.filter((x) => x.id !== p.id));
      flash(`Deleted ${p.email}`);
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
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Admin</h1>
              <p className="text-xs text-stone-500">
                Add, edit, and delete users · manage roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => {
                setShowCreate(true);
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add user
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white hover:bg-campero-orange-dark"
            >
              Back to brief
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-1">
            Form catalogs
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            Shared lists that power each tab — same add / edit / delete pattern
            as Digital, Paid Media, PR, and IT / OLO.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/overview/"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 hover:border-campero-orange/40 hover:bg-orange-50/40 transition-colors"
            >
              <p className="text-sm font-bold text-stone-900">Overview</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Project leads &amp; location options
              </p>
            </Link>
            <Link
              href="/admin/it/"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 hover:border-campero-orange/40 hover:bg-orange-50/40 transition-colors"
            >
              <p className="text-sm font-bold text-stone-900">IT / OLO</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Online ordering checklist assets
              </p>
            </Link>
            <Link
              href="/admin/catalog/digital/"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 hover:border-campero-orange/40 hover:bg-orange-50/40 transition-colors"
            >
              <p className="text-sm font-bold text-stone-900">
                Digital · Paid · In-Store · PR
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Form asset catalogs
              </p>
            </Link>
            <Link
              href="/admin/legal/"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 hover:border-campero-orange/40 hover:bg-orange-50/40 transition-colors"
            >
              <p className="text-sm font-bold text-stone-900">Legal templates</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Shared legal chips &amp; copy
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-1">Roles</h2>
          <ul className="text-sm text-stone-600 space-y-1 list-disc pl-5">
            <li>
              <strong>admin</strong> — this page + create/edit/delete users
            </li>
            <li>
              <strong>editor</strong> — create and edit shared briefs
            </li>
            <li>
              <strong>viewer</strong> — can log in (save limits can be added
              later)
            </li>
          </ul>
        </section>

        {message && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {error}
            {error.toLowerCase().includes("service_role") ||
            error.toLowerCase().includes("misconfigured") ? (
              <span className="block mt-2 text-xs">
                Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
                <code>.env.local</code> (from Supabase → Settings → API Keys →
                service_role / secret). Restart <code>npm run dev</code>. Never
                put this key in the browser or GitHub.
              </span>
            ) : null}
          </p>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={onCreate}
              className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Add user</h3>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Temporary password
                </label>
                <input
                  required
                  type="text"
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Display name (optional)
                </label>
                <input
                  type="text"
                  value={createForm.display_name}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      display_name: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-campero-orange py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create user"}
              </button>
            </form>
          </div>
        )}

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={onEdit}
              className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Edit user</h3>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Display name
                </label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      display_name: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">
                  New password (optional)
                </label>
                <input
                  type="text"
                  minLength={6}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-campero-orange py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3">
            <h2 className="text-sm font-bold text-stone-900">
              Users ({profiles.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-stone-400">
              Loading users…
            </p>
          ) : profiles.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">
              No users yet. Click <strong>Add user</strong>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-stone-50 hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-stone-900">
                          {p.email || "—"}
                          {p.id === user?.id && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-campero-orange">
                              you
                            </span>
                          )}
                        </div>
                        {p.display_name && (
                          <div className="text-xs text-stone-400">
                            {p.display_name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${roleBadgeClass(p.role)}`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-500 text-xs">
                        {p.created_at
                          ? format(new Date(p.created_at), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={p.id === user?.id || busy}
                            onClick={() => void onDelete(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}

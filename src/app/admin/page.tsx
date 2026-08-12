"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  AdminEmptyState,
  AdminFlash,
  AdminHeader,
  AdminItemActions,
  AdminListTile,
  AdminMain,
  AdminPageShell,
  AdminSectionHeader,
  adminFieldClass,
  adminLabelClass,
} from "@/components/admin/AdminUi";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ProfileRow, UserRole } from "@/lib/supabase/adminApi";
import {
  apiCreateUser,
  apiDeleteUser,
  apiListUsers,
  apiUpdateUser,
} from "@/lib/supabase/adminClientApi";
import { format } from "date-fns";
import { Shield, X } from "lucide-react";

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
    <AdminPageShell>
      <AdminHeader
        title="Manage users"
        subtitle="Add, edit, and delete users · manage roles"
        onRefresh={() => void load()}
        icon={Shield}
      />

      <AdminMain>
        <div className="space-y-3">
          <AdminSectionHeader
            title="Roles"
            addLabel="Add user"
            onAdd={() => {
              setShowCreate(true);
              setError(null);
            }}
          />
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <ul className="text-sm text-stone-600 space-y-1 list-disc pl-5">
              <li>
                <strong>admin</strong> — manage users and form catalogs
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
        </div>

        <AdminFlash
          message={message}
          error={error}
          sqlHint={
            error &&
            (error.toLowerCase().includes("service_role") ||
              error.toLowerCase().includes("misconfigured")) ? (
              <span className="block mt-2 text-xs">
                Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
                <code>.env.local</code> (from Supabase → Settings → API Keys →
                service_role / secret). Restart <code>npm run dev</code>. Never
                put this key in the browser or GitHub.
              </span>
            ) : null
          }
        />

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
                <label className={adminLabelClass}>Email</label>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <label className={adminLabelClass}>Temporary password</label>
                <input
                  required
                  type="text"
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={adminFieldClass}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className={adminLabelClass}>
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
                  className={adminFieldClass}
                />
              </div>
              <div>
                <label className={adminLabelClass}>
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
                  className={adminFieldClass}
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
                className="w-full rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
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
                <label className={adminLabelClass}>Email</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <label className={adminLabelClass}>Display name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      display_name: e.target.value,
                    }))
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <label className={adminLabelClass}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className={adminFieldClass}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={adminLabelClass}>
                  New password (optional)
                </label>
                <input
                  type="text"
                  minLength={6}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={adminFieldClass}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          <AdminSectionHeader
            title="Users"
            count={profiles.length}
            loading={loading}
          />
          <div className="space-y-3">
            {loading ? (
              <AdminEmptyState>Loading users…</AdminEmptyState>
            ) : profiles.length === 0 ? (
              <AdminEmptyState>
                No users yet. Click <strong>Add user</strong>.
              </AdminEmptyState>
            ) : (
              profiles.map((p) => (
                <AdminListTile
                  key={p.id}
                  active={p.id === user?.id}
                  title={
                    <>
                      {p.email || "—"}
                      {p.id === user?.id && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-campero-orange">
                          you
                        </span>
                      )}
                    </>
                  }
                  actions={
                    <AdminItemActions
                      busy={busy}
                      deleteDisabled={p.id === user?.id}
                      onEdit={() => openEdit(p)}
                      onDelete={() => void onDelete(p)}
                    />
                  }
                >
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {p.display_name && (
                      <span className="text-xs text-stone-500">
                        {p.display_name}
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${roleBadgeClass(p.role)}`}
                    >
                      {p.role}
                    </span>
                    <span className="text-xs text-stone-400">
                      {p.created_at
                        ? `Joined ${format(new Date(p.created_at), "MMM d, yyyy")}`
                        : null}
                    </span>
                  </div>
                </AdminListTile>
              ))
            )}
          </div>
        </div>
      </AdminMain>
    </AdminPageShell>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}

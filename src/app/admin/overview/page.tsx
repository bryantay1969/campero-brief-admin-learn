"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminGate } from "@/components/auth/AdminGate";
import {
  AdminEmptyState,
  AdminField,
  AdminFlash,
  AdminHeader,
  AdminInactiveBadge,
  AdminItemActions,
  AdminListTile,
  AdminMain,
  AdminModal,
  AdminModalCancel,
  AdminModalSubmit,
  AdminPageShell,
  AdminSectionHeader,
  adminFieldClass,
} from "@/components/admin/AdminUi";
import type { OverviewOptionKind } from "@/lib/overviewOptions";
import {
  createOverviewOption,
  deleteOverviewOption,
  fetchAllOverviewOptions,
  updateOverviewOption,
  type OverviewOptionRow,
} from "@/lib/supabase/overviewOptionsApi";

type SectionMeta = {
  kind: OverviewOptionKind;
  title: string;
  itemLabel: string;
  namePlaceholder: string;
};

const SECTIONS: SectionMeta[] = [
  {
    kind: "project_lead",
    title: "Project leads",
    itemLabel: "project lead",
    namePlaceholder: "e.g. Alex Rivera",
  },
  {
    kind: "location",
    title: "Locations",
    itemLabel: "location",
    namePlaceholder: "e.g. Houston",
  },
];

function emptyForm() {
  return {
    label: "",
    sort_order: 100,
    is_active: true,
  };
}

type FormState = {
  kind: OverviewOptionKind;
  editingId: string | null;
  form: ReturnType<typeof emptyForm>;
};

function OverviewAdminPanel() {
  const [leads, setLeads] = useState<OverviewOptionRow[]>([]);
  const [locations, setLocations] = useState<OverviewOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formState, setFormState] = useState<FormState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadRows, locationRows] = await Promise.all([
        fetchAllOverviewOptions("project_lead"),
        fetchAllOverviewOptions("location"),
      ]);
      setLeads(leadRows);
      setLocations(locationRows);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load options. Did you run overview-options.sql?"
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

  const rowsFor = (kind: OverviewOptionKind) =>
    kind === "project_lead" ? leads : locations;

  const metaFor = (kind: OverviewOptionKind) =>
    SECTIONS.find((s) => s.kind === kind)!;

  const openCreate = (kind: OverviewOptionKind) => {
    const rows = rowsFor(kind);
    setFormState({
      kind,
      editingId: null,
      form: {
        ...emptyForm(),
        sort_order:
          rows.reduce((max, r) => Math.max(max, r.sort_order), 0) + 10 || 100,
      },
    });
    setError(null);
  };

  const openEdit = (row: OverviewOptionRow) => {
    setFormState({
      kind: row.kind,
      editingId: row.id,
      form: {
        label: row.label,
        sort_order: row.sort_order,
        is_active: row.is_active,
      },
    });
    setError(null);
  };

  const closeForm = () => setFormState(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState) return;
    setBusy(true);
    setError(null);
    const { kind, editingId, form } = formState;
    try {
      if (editingId) {
        await updateOverviewOption(editingId, form);
        flash(`Saved “${form.label.trim()}” for everyone`);
      } else {
        await createOverviewOption({
          kind,
          label: form.label,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        flash(`Created “${form.label.trim()}” for everyone`);
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (row: OverviewOptionRow) => {
    const meta = metaFor(row.kind);
    if (
      !window.confirm(
        [
          `Delete ${meta.itemLabel} “${row.label}” for EVERYONE?`,
          "",
          "Removes it from the shared Overview list for all users.",
          "Briefs that already saved this value keep their own copy.",
        ].join("\n")
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteOverviewOption(row.id);
      if (formState?.editingId === row.id) closeForm();
      flash(`Deleted “${row.label}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const renderSection = (meta: SectionMeta) => {
    const rows = rowsFor(meta.kind);
    return (
      <div key={meta.kind} className="space-y-3">
        <AdminSectionHeader
          title={meta.title}
          count={rows.length}
          loading={loading}
          onAdd={() => openCreate(meta.kind)}
        />
        <div className="space-y-3">
          {loading ? (
            <AdminEmptyState>Loading…</AdminEmptyState>
          ) : rows.length === 0 ? (
            <AdminEmptyState>
              No rows. Run <code>overview-options.sql</code> or add an option.
            </AdminEmptyState>
          ) : (
            rows.map((row) => (
              <AdminListTile
                key={row.id}
                active={row.is_active}
                title={
                  <>
                    {row.label}
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
                <p className="text-xs text-stone-500 mt-0.5">
                  Sort {row.sort_order}
                </p>
              </AdminListTile>
            ))
          )}
        </div>
      </div>
    );
  };

  const activeMeta = formState ? metaFor(formState.kind) : null;

  return (
    <AdminPageShell>
      <AdminHeader
        title="Overview options"
        subtitle="Project leads & locations · shared for everyone"
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
                Run <code>supabase/overview-options.sql</code> in Supabase
                first.
              </span>
            ) : null
          }
        />

        {formState && activeMeta && (
          <AdminModal
            eyebrow={
              formState.editingId ? "Edit for everyone" : "Add for everyone"
            }
            title={
              formState.editingId
                ? formState.form.label || "Option"
                : `New ${activeMeta.itemLabel}`
            }
            onClose={closeForm}
            onSubmit={onSubmit}
            footer={
              <>
                <AdminModalSubmit
                  busy={busy}
                  isEdit={!!formState.editingId}
                />
                <AdminModalCancel onClick={closeForm} />
              </>
            }
          >
            <AdminField label="Name">
              <input
                required
                value={formState.form.label}
                onChange={(e) =>
                  setFormState((s) =>
                    s
                      ? {
                          ...s,
                          form: { ...s.form, label: e.target.value },
                        }
                      : s
                  )
                }
                className={adminFieldClass}
                placeholder={activeMeta.namePlaceholder}
              />
            </AdminField>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Sort order">
                <input
                  type="number"
                  value={formState.form.sort_order}
                  onChange={(e) =>
                    setFormState((s) =>
                      s
                        ? {
                            ...s,
                            form: {
                              ...s.form,
                              sort_order: Number(e.target.value) || 0,
                            },
                          }
                        : s
                    )
                  }
                  className={adminFieldClass}
                />
              </AdminField>
              <label className="flex items-center gap-2 text-sm pt-6 font-medium">
                <input
                  type="checkbox"
                  checked={formState.form.is_active}
                  onChange={(e) =>
                    setFormState((s) =>
                      s
                        ? {
                            ...s,
                            form: {
                              ...s.form,
                              is_active: e.target.checked,
                            },
                          }
                        : s
                    )
                  }
                  className="rounded border-stone-300 text-campero-orange"
                />
                Active
              </label>
            </div>
          </AdminModal>
        )}

        {SECTIONS.map((meta) => renderSection(meta))}
      </AdminMain>
    </AdminPageShell>
  );
}

export default function OverviewAdminPage() {
  return (
    <AdminGate>
      <OverviewAdminPanel />
    </AdminGate>
  );
}

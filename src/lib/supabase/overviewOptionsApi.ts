import { getSupabase } from "./client";
import {
  builtinsForKind,
  type OverviewOptionDef,
  type OverviewOptionKind,
} from "@/lib/overviewOptions";

export type OverviewOptionRow = {
  id: string;
  kind: OverviewOptionKind;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

function formatError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  return [error.message, error.code && `(${error.code})`, error.details, error.hint]
    .filter(Boolean)
    .join(" — ");
}

export function rowToDef(row: OverviewOptionRow): OverviewOptionDef {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    sortOrder: row.sort_order,
    dbId: row.id,
    isActive: row.is_active,
  };
}

/** Active options for the Overview form (cloud, fallback to built-ins). */
export async function fetchOverviewOptionsForForm(
  kind: OverviewOptionKind
): Promise<OverviewOptionDef[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("overview_options")
      .select("*")
      .eq("kind", kind)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return (data as OverviewOptionRow[]).map(rowToDef);
    }
  } catch (e) {
    console.warn(`Overview options (${kind}) from cloud unavailable:`, e);
  }
  return builtinsForKind(kind);
}

/** All options for admin (including inactive). */
export async function fetchAllOverviewOptions(
  kind: OverviewOptionKind
): Promise<OverviewOptionRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("overview_options")
    .select("*")
    .eq("kind", kind)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) throw new Error(formatError(error));
  return (data || []) as OverviewOptionRow[];
}

export async function createOverviewOption(input: {
  kind: OverviewOptionKind;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<OverviewOptionRow> {
  const supabase = getSupabase();
  const label = input.label.trim();
  if (!label) throw new Error("Name is required");

  const { data, error } = await supabase
    .from("overview_options")
    .insert({
      kind: input.kind,
      label,
      sort_order: input.sort_order ?? 100,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as OverviewOptionRow;
}

export async function updateOverviewOption(
  id: string,
  input: {
    label?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<OverviewOptionRow> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) throw new Error("Name is required");
    patch.label = label;
  }
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("overview_options")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as OverviewOptionRow;
}

export async function deleteOverviewOption(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("overview_options")
    .delete()
    .eq("id", id);
  if (error) throw new Error(formatError(error));
}

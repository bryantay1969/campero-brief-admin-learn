import { getSupabase } from "./client";
import {
  BUILTIN_IT_CATALOG,
  type ITCatalogDef,
} from "@/lib/itElements";

export type ITCatalogRow = {
  id: string;
  slug: string;
  title: string;
  specs: string;
  notes_default: string;
  notes_placeholder: string;
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

export function rowToDef(row: ITCatalogRow): ITCatalogDef {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    specs: row.specs,
    notesDefault: row.notes_default,
    notesPlaceholder: row.notes_placeholder,
    dbId: row.id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Active catalog for the form (cloud, fallback to built-ins). */
export async function fetchITCatalogForForm(): Promise<ITCatalogDef[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("it_asset_catalog")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return (data as ITCatalogRow[]).map(rowToDef);
    }
  } catch (e) {
    console.warn("IT catalog from cloud unavailable, using built-ins:", e);
  }
  return BUILTIN_IT_CATALOG.map((t) => ({ ...t }));
}

export async function fetchAllITCatalog(): Promise<ITCatalogRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("it_asset_catalog")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(formatError(error));
  return (data || []) as ITCatalogRow[];
}

export async function createITCatalogItem(input: {
  slug: string;
  title: string;
  specs: string;
  notes_default: string;
  notes_placeholder: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<ITCatalogRow> {
  const supabase = getSupabase();
  const slug = input.slug
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug) throw new Error("Slug is required");
  if (!input.title.trim()) throw new Error("Title is required");

  const { data, error } = await supabase
    .from("it_asset_catalog")
    .insert({
      slug,
      title: input.title.trim(),
      specs: input.specs.trim(),
      notes_default: input.notes_default,
      notes_placeholder: input.notes_placeholder.trim(),
      sort_order: input.sort_order ?? 100,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as ITCatalogRow;
}

export async function updateITCatalogItem(
  id: string,
  input: {
    slug?: string;
    title?: string;
    specs?: string;
    notes_default?: string;
    notes_placeholder?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<ITCatalogRow> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.slug !== undefined) {
    patch.slug = input.slug
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "");
  }
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.specs !== undefined) patch.specs = input.specs.trim();
  if (input.notes_default !== undefined) {
    patch.notes_default = input.notes_default;
  }
  if (input.notes_placeholder !== undefined) {
    patch.notes_placeholder = input.notes_placeholder.trim();
  }
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("it_asset_catalog")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as ITCatalogRow;
}

export async function deleteITCatalogItem(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("it_asset_catalog")
    .delete()
    .eq("id", id);
  if (error) throw new Error(formatError(error));
}

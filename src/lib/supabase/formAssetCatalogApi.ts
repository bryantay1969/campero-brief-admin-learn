import { getSupabase } from "./client";
import type {
  CatalogSection,
  FormAssetCatalogDef,
} from "@/lib/formAssetCatalog";
import { BUILTIN_CATALOGS } from "@/lib/formAssetCatalogBuiltins";

export type FormAssetCatalogRow = {
  id: string;
  section: CatalogSection;
  slug: string;
  title: string;
  specs: string;
  notes_default: string;
  notes_placeholder: string;
  priority_default: string;
  link_label: string;
  link_href: string;
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

export function rowToDef(row: FormAssetCatalogRow): FormAssetCatalogDef {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    specs: row.specs,
    notesDefault: row.notes_default,
    notesPlaceholder: row.notes_placeholder,
    priorityDefault: row.priority_default || "",
    linkLabel: row.link_label || "",
    linkHref: row.link_href || "",
    dbId: row.id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function fetchCatalogForForm(
  section: CatalogSection
): Promise<FormAssetCatalogDef[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("form_asset_catalog")
      .select("*")
      .eq("section", section)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return (data as FormAssetCatalogRow[]).map(rowToDef);
    }
  } catch (e) {
    console.warn(`Catalog ${section} from cloud unavailable:`, e);
  }
  return (BUILTIN_CATALOGS[section] || []).map((t) => ({ ...t }));
}

export async function fetchAllCatalog(
  section: CatalogSection
): Promise<FormAssetCatalogRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("form_asset_catalog")
    .select("*")
    .eq("section", section)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(formatError(error));
  return (data || []) as FormAssetCatalogRow[];
}

export async function createCatalogItem(
  section: CatalogSection,
  input: {
    slug: string;
    title: string;
    specs: string;
    notes_default: string;
    notes_placeholder: string;
    priority_default?: string;
    link_label?: string;
    link_href?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<FormAssetCatalogRow> {
  const supabase = getSupabase();
  const slug = input.slug
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug) throw new Error("Slug is required");
  if (!input.title.trim()) throw new Error("Title is required");

  const { data, error } = await supabase
    .from("form_asset_catalog")
    .insert({
      section,
      slug,
      title: input.title.trim(),
      specs: input.specs.trim(),
      notes_default: input.notes_default,
      notes_placeholder: input.notes_placeholder.trim(),
      priority_default: (input.priority_default || "").trim(),
      link_label: (input.link_label || "").trim(),
      link_href: (input.link_href || "").trim(),
      sort_order: input.sort_order ?? 100,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as FormAssetCatalogRow;
}

export async function updateCatalogItem(
  id: string,
  input: {
    title?: string;
    specs?: string;
    notes_default?: string;
    notes_placeholder?: string;
    priority_default?: string;
    link_label?: string;
    link_href?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<FormAssetCatalogRow> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.specs !== undefined) patch.specs = input.specs.trim();
  if (input.notes_default !== undefined) {
    patch.notes_default = input.notes_default;
  }
  if (input.notes_placeholder !== undefined) {
    patch.notes_placeholder = input.notes_placeholder.trim();
  }
  if (input.priority_default !== undefined) {
    patch.priority_default = input.priority_default.trim();
  }
  if (input.link_label !== undefined) {
    patch.link_label = input.link_label.trim();
  }
  if (input.link_href !== undefined) patch.link_href = input.link_href.trim();
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("form_asset_catalog")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as FormAssetCatalogRow;
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("form_asset_catalog")
    .delete()
    .eq("id", id);
  if (error) throw new Error(formatError(error));
}

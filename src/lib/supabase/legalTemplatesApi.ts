import { getSupabase } from "./client";
import {
  BUILTIN_LEGAL_TEMPLATES,
  type LegalTemplateDef,
} from "@/lib/legalTemplates";

export type LegalTemplateRow = {
  id: string;
  slug: string;
  label: string;
  description: string;
  body: string;
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

export function rowToDef(row: LegalTemplateRow): LegalTemplateDef {
  return {
    id: row.slug,
    slug: row.slug,
    label: row.label,
    description: row.description,
    text: row.body,
    dbId: row.id,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

/** Active templates for the form (cloud, fallback to built-ins). */
export async function fetchLegalTemplatesForForm(): Promise<LegalTemplateDef[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("legal_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return (data as LegalTemplateRow[]).map(rowToDef);
    }
  } catch (e) {
    console.warn("Legal templates from cloud unavailable, using built-ins:", e);
  }
  return BUILTIN_LEGAL_TEMPLATES.map((t) => ({ ...t }));
}

/** All templates for admin (including inactive). */
export async function fetchAllLegalTemplates(): Promise<LegalTemplateRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("legal_templates")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(formatError(error));
  return (data || []) as LegalTemplateRow[];
}

export async function createLegalTemplate(input: {
  slug: string;
  label: string;
  description: string;
  body: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<LegalTemplateRow> {
  const supabase = getSupabase();
  const slug = input.slug
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug) throw new Error("Slug is required");
  if (!input.label.trim()) throw new Error("Label is required");
  if (!input.body.trim()) throw new Error("Legal text is required");

  const { data, error } = await supabase
    .from("legal_templates")
    .insert({
      slug,
      label: input.label.trim(),
      description: input.description.trim(),
      body: input.body.trim(),
      sort_order: input.sort_order ?? 100,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as LegalTemplateRow;
}

export async function updateLegalTemplate(
  id: string,
  input: {
    slug?: string;
    label?: string;
    description?: string;
    body?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<LegalTemplateRow> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.slug !== undefined) {
    patch.slug = input.slug.trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "");
  }
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.description !== undefined) {
    patch.description = input.description.trim();
  }
  if (input.body !== undefined) patch.body = input.body.trim();
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("legal_templates")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return data as LegalTemplateRow;
}

/**
 * Save a global shared template by slug.
 * Updates the cloud row if it exists; otherwise creates it (e.g. first save of a built-in).
 */
export async function saveSharedLegalTemplate(input: {
  slug: string;
  label: string;
  description?: string;
  body: string;
  sort_order?: number;
}): Promise<LegalTemplateRow> {
  const supabase = getSupabase();
  const slug = input.slug
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug) throw new Error("Slug is required");
  if (!input.label.trim()) throw new Error("Label is required");
  if (!input.body.trim()) throw new Error("Legal text is required");

  const { data: existing, error: findError } = await supabase
    .from("legal_templates")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (findError) throw new Error(formatError(findError));

  if (existing?.id) {
    return updateLegalTemplate(existing.id, {
      label: input.label,
      description: input.description ?? "",
      body: input.body,
      sort_order: input.sort_order,
      is_active: true,
    });
  }

  return createLegalTemplate({
    slug,
    label: input.label,
    description: input.description ?? "",
    body: input.body,
    sort_order: input.sort_order ?? 100,
    is_active: true,
  });
}

export async function deleteLegalTemplate(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("legal_templates").delete().eq("id", id);
  if (error) throw new Error(formatError(error));
}

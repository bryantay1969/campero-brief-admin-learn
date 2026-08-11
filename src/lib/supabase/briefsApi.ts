import type { PromoBrief, SavedBriefRecord } from "@/lib/types";
import { getSupabase } from "./client";

export type BriefRow = {
  id: string;
  name: string;
  data: PromoBrief;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
};

export function rowToRecord(row: BriefRow): SavedBriefRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    brief: row.data,
  };
}

function formatError(error: { message?: string; code?: string; details?: string; hint?: string }): string {
  const parts = [
    error.message,
    error.code ? `(${error.code})` : null,
    error.details,
    error.hint,
  ].filter(Boolean);
  return parts.join(" — ") || "Unknown Supabase error";
}

export async function fetchCloudBriefs(): Promise<SavedBriefRecord[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("briefs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(formatError(error));
  return ((data || []) as BriefRow[]).map(rowToRecord);
}

/**
 * Insert or update a brief in Supabase.
 * Uses true upsert so local UUIDs work as cloud IDs on first save.
 */
export async function upsertCloudBrief(input: {
  id?: string | null;
  name: string;
  brief: PromoBrief;
  userId: string;
}): Promise<SavedBriefRecord> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const id =
    input.id && input.id.trim()
      ? input.id
      : typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `brief-${Date.now()}`;

  // Check if row already exists (update vs insert for created_by)
  const { data: existing, error: existingError } = await supabase
    .from("briefs")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    throw new Error(formatError(existingError));
  }

  if (existing) {
    const { data, error } = await supabase
      .from("briefs")
      .update({
        name: input.name,
        data: input.brief,
        updated_by: input.userId,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(formatError(error));
    return rowToRecord(data as BriefRow);
  }

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      id,
      name: input.name,
      data: input.brief,
      created_by: input.userId,
      updated_by: input.userId,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(formatError(error));
  return rowToRecord(data as BriefRow);
}

export async function deleteCloudBrief(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("briefs").delete().eq("id", id);
  if (error) throw new Error(formatError(error));
}

export async function renameCloudBrief(
  id: string,
  name: string,
  userId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("briefs")
    .update({
      name,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(formatError(error));
}

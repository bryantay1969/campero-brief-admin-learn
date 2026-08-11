import { getSupabase } from "./client";

export type UserRole = "admin" | "editor" | "viewer";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: string;
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

export async function fetchMyProfile(): Promise<ProfileRow | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(formatError(error));
  return data as ProfileRow | null;
}

export async function fetchAllProfiles(): Promise<ProfileRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(formatError(error));
  return (data || []) as ProfileRow[];
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(formatError(error));
}

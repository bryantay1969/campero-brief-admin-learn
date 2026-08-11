import { getSupabase } from "./client";
import type { ProfileRow, UserRole } from "./adminApi";

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not signed in");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function parseJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function apiListUsers(): Promise<ProfileRow[]> {
  const res = await fetch("/api/admin/users", {
    headers: await authHeaders(),
  });
  const body = await parseJson(res);
  return body.users as ProfileRow[];
}

export async function apiCreateUser(input: {
  email: string;
  password: string;
  role: UserRole;
  display_name?: string;
}): Promise<ProfileRow> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await parseJson(res);
  return body.user as ProfileRow;
}

export async function apiUpdateUser(input: {
  id: string;
  email?: string;
  password?: string;
  role?: UserRole;
  display_name?: string;
}): Promise<ProfileRow> {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await parseJson(res);
  return body.user as ProfileRow;
}

export async function apiDeleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await parseJson(res);
}

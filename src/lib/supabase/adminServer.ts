import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/** Service-role client — server only. Never import into client components. */
export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Verify Bearer token and ensure the user is an admin. */
export async function requireAdminFromRequest(
  request: Request
): Promise<{ user: User; admin: SupabaseClient }> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
    });
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
    });
  }

  const admin = getServiceSupabase();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
    });
  }

  if (!profile || profile.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403,
    });
  }

  return { user, admin };
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

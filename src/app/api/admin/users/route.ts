import { json, requireAdminFromRequest } from "@/lib/supabase/adminServer";

type Role = "admin" | "editor" | "viewer";

function isRole(v: unknown): v is Role {
  return v === "admin" || v === "editor" || v === "viewer";
}

/** List users (profiles) — admin only */
export async function GET(request: Request) {
  try {
    const { admin } = await requireAdminFromRequest(request);
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return json({ error: error.message }, 400);
    return json({ users: data || [] });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(
      { error: e instanceof Error ? e.message : "List failed" },
      500
    );
  }
}

/** Create user — admin only */
export async function POST(request: Request) {
  try {
    const { admin } = await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: string;
      display_name?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password || "";
    const role = isRole(body.role) ? body.role : "editor";
    const display_name = body.display_name?.trim() || null;

    if (!email || !email.includes("@")) {
      return json({ error: "Valid email is required" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: display_name ? { display_name } : undefined,
      });

    if (createError || !created.user) {
      return json(
        { error: createError?.message || "Could not create user" },
        400
      );
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user.id,
      email,
      role,
      display_name,
    });

    if (profileError) {
      return json(
        {
          error: `User created but profile update failed: ${profileError.message}`,
          userId: created.user.id,
        },
        400
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", created.user.id)
      .single();

    return json({ user: profile }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return json(
      { error: e instanceof Error ? e.message : "Create failed" },
      500
    );
  }
}

/** Update user (role, display name, email, optional password) */
export async function PATCH(request: Request) {
  try {
    const { user: actor, admin } = await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      id?: string;
      email?: string;
      password?: string;
      role?: string;
      display_name?: string;
    };

    const id = body.id?.trim();
    if (!id) return json({ error: "User id is required" }, 400);

    if (body.role && !isRole(body.role)) {
      return json({ error: "Invalid role" }, 400);
    }

    const authUpdate: {
      email?: string;
      password?: string;
      user_metadata?: { display_name?: string };
    } = {};

    if (body.email?.trim()) {
      authUpdate.email = body.email.trim().toLowerCase();
    }
    if (body.password && body.password.length >= 6) {
      authUpdate.password = body.password;
    }
    if (body.display_name !== undefined) {
      authUpdate.user_metadata = {
        display_name: body.display_name.trim() || undefined,
      };
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await admin.auth.admin.updateUserById(
        id,
        authUpdate
      );
      if (authError) return json({ error: authError.message }, 400);
    }

    const profileUpdate: Record<string, unknown> = {};
    if (body.role) profileUpdate.role = body.role;
    if (body.email?.trim()) {
      profileUpdate.email = body.email.trim().toLowerCase();
    }
    if (body.display_name !== undefined) {
      profileUpdate.display_name = body.display_name.trim() || null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", id);
      if (profileError) return json({ error: profileError.message }, 400);
    }

    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return json({ error: error.message }, 400);

    return json({ user: profile, updatedBy: actor.id });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(
      { error: e instanceof Error ? e.message : "Update failed" },
      500
    );
  }
}

/** Delete user from Auth + profile */
export async function DELETE(request: Request) {
  try {
    const { user: actor, admin } = await requireAdminFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) return json({ error: "User id is required" }, 400);
    if (id === actor.id) {
      return json({ error: "You cannot delete your own account" }, 400);
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);

    await admin.from("profiles").delete().eq("id", id);

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      500
    );
  }
}

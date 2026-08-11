"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { LogOut, Shield } from "lucide-react";

export function AuthBar() {
  const { configured, loading, user, canAdmin, role, isViewer, signOut } =
    useAuth();
  const router = useRouter();

  if (!configured) {
    return (
      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
        Add Supabase keys to .env.local
      </span>
    );
  }

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden sm:inline max-w-[180px] truncate text-xs text-stone-500"
        title={user.email || user.id}
      >
        ☁ {user.email || "Signed in"}
        {role ? ` · ${role}` : ""}
      </span>
      {isViewer && (
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Viewer
        </span>
      )}
      {canAdmin && (
        <Link
          href="/admin/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100"
        >
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.replace("/login/");
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log out
      </button>
    </div>
  );
}

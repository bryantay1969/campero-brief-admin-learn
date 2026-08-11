"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { fetchMyProfile } from "@/lib/supabase/adminApi";
import { LogOut, Shield } from "lucide-react";

export function AuthBar() {
  const { configured, loading, user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetchMyProfile()
      .then((p) => {
        if (!cancelled) setIsAdmin(p?.role === "admin");
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
        className="hidden sm:inline max-w-[160px] truncate text-xs text-stone-500"
        title={user.email || user.id}
      >
        ☁ {user.email || "Signed in"}
      </span>
      {isAdmin && (
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

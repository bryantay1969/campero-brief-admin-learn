"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

/**
 * Blocks the brief builder until the user is signed in.
 * Shows a short loading state while the session is checked.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!configured) return;
    if (loading) return;
    if (!user) {
      router.replace("/login/");
    }
  }, [configured, loading, user, router]);

  if (!configured) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-lg font-bold text-stone-900 mb-2">
            Supabase not configured
          </h1>
          <p className="text-sm text-stone-600">
            Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-xs">.env.local</code>, then restart{" "}
            <code className="text-xs">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
        <p className="text-sm text-stone-500">Checking login…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
        <p className="text-sm text-stone-500">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}

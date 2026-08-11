"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { fetchMyProfile, type ProfileRow } from "@/lib/supabase/adminApi";

export function AdminGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    if (loading) return;
    if (!user) {
      router.replace("/login/");
      return;
    }

    let cancelled = false;
    fetchMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load profile");
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, router]);

  if (!configured || loading || profile === undefined) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center">
        <p className="text-sm text-stone-500">Checking admin access…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center">
        <p className="text-sm text-stone-500">Redirecting to login…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-campero-orange"
          >
            ← Back to builder
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-stone-900 mb-2">
            Admin only
          </h1>
          <p className="text-sm text-stone-600 mb-4">
            Your role is{" "}
            <strong>{profile?.role || "unknown"}</strong>. Ask an admin to
            promote you, or run this in Supabase SQL (use your email):
          </p>
          <pre className="text-left text-[11px] bg-stone-50 border border-stone-100 rounded-lg p-3 overflow-x-auto text-stone-700 mb-4">
            {`update public.profiles
set role = 'admin'
where email = 'you@example.com';`}
          </pre>
          <Link
            href="/"
            className="text-sm font-semibold text-campero-orange hover:underline"
          >
            ← Back to builder
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

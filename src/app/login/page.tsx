"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { signIn, signUp, configured, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
        else router.push("/");
      } else {
        const err = await signUp(email.trim(), password);
        if (err) setError(err);
        else {
          setInfo(
            "Account created. If email confirmation is on, check your inbox. Otherwise you can sign in now."
          );
          setMode("signin");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D04] to-[#FFBA08] text-white font-black text-sm">
            PC
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              {mode === "signin" ? "Log in" : "Create account"}
            </h1>
            <p className="text-xs text-stone-500">
              Shared briefs library (learning / admin)
            </p>
          </div>
        </div>

        {!configured && (
          <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Missing Supabase keys. Add them to{" "}
            <code className="text-xs">.env.local</code> and restart{" "}
            <code className="text-xs">npm run dev</code>.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !configured}
            className="w-full rounded-xl bg-campero-orange py-3 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-campero-orange-dark disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Log in"
                : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-sm font-medium text-campero-orange hover:underline"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>

        <p className="mt-6 text-center text-xs text-stone-400">
          You must log in to use the brief builder.
        </p>
      </div>
    </div>
  );
}

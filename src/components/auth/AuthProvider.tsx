"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase/client";
import { fetchCloudBriefs } from "@/lib/supabase/briefsApi";
import { useBriefStore } from "@/store/briefStore";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  cloudEnabled: boolean;
  refreshCloudLibrary: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseConfig();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const setLibrary = useBriefStore((s) => s.setCloudLibrary);

  const refreshCloudLibrary = useCallback(async () => {
    if (!configured) return;
    try {
      const rows = await fetchCloudBriefs();
      setLibrary(rows);
    } catch (e) {
      console.warn("Could not load cloud briefs:", e);
    }
  }, [configured, setLibrary]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void refreshCloudLibrary();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) {
        void refreshCloudLibrary();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, refreshCloudLibrary]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      return error ? error.message : null;
    } catch (e) {
      return e instanceof Error ? e.message : "Sign in failed";
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await getSupabase().auth.signUp({ email, password });
      return error ? error.message : null;
    } catch (e) {
      return e instanceof Error ? e.message : "Sign up failed";
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      cloudEnabled: configured && !!session?.user,
      refreshCloudLibrary,
      signIn,
      signUp,
      signOut,
    }),
    [
      configured,
      loading,
      session,
      refreshCloudLibrary,
      signIn,
      signUp,
      signOut,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

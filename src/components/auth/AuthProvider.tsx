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
import {
  fetchMyProfile,
  type ProfileRow,
  type UserRole,
} from "@/lib/supabase/adminApi";
import { useBriefStore } from "@/store/briefStore";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  /** Logged in and can use cloud library list */
  cloudEnabled: boolean;
  /** Can create/update shared briefs (admin + editor) */
  canEdit: boolean;
  /** Admin panel access */
  canAdmin: boolean;
  /** View-only account */
  isViewer: boolean;
  refreshCloudLibrary: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseConfig();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
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

  const refreshProfile = useCallback(async () => {
    if (!configured) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchMyProfile();
      setProfile(p);
    } catch (e) {
      console.warn("Could not load profile:", e);
      setProfile(null);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await refreshProfile();
        await refreshCloudLibrary();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) {
        void refreshProfile();
        void refreshCloudLibrary();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, refreshCloudLibrary, refreshProfile]);

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
    setProfile(null);
  }, []);

  const role = profile?.role ?? null;
  const canEdit = role === "admin" || role === "editor";
  const canAdmin = role === "admin";
  const isViewer = role === "viewer";

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      role,
      cloudEnabled: configured && !!session?.user,
      canEdit,
      canAdmin,
      isViewer,
      refreshCloudLibrary,
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [
      configured,
      loading,
      session,
      profile,
      role,
      canEdit,
      canAdmin,
      isViewer,
      refreshCloudLibrary,
      refreshProfile,
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

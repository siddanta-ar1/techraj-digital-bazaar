"use client";

import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  wallet_balance: number;
  role: "user" | "admin";
  phone?: string;
  is_synced?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const syncingRef = useRef(false);

  // Fetch user profile with retry logic
  const fetchUserProfile = useCallback(
    async (
      userId: string,
      retryCount = 0,
    ): Promise<{ data: any; error: any }> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return fetchUserProfile(userId, retryCount + 1);
        }

        return { data, error };
      } catch (err) {
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return fetchUserProfile(userId, retryCount + 1);
        }
        return { data: null, error: err };
      }
    },
    [supabase],
  );

  // Sync user profile data
  const syncProfile = useCallback(
    async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      // Prevent concurrent syncing
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        const { data, error } = await fetchUserProfile(authUser.id);

        if (error || !data) {
          console.error("Profile fetch failed, signing out for security:", error);
          await supabase.auth.signOut();
          setUser(null);
        } else {
          // Use JWT app_metadata.role as primary source — it matches what middleware
          // enforces, so the nav only shows the admin link when the middleware allows it.
          const jwtRole = authUser.app_metadata?.role as "user" | "admin" | undefined;
          setUser({
            id: data.id,
            email: data.email,
            full_name: data.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined,
            wallet_balance: data.wallet_balance ?? 0,
            role: jwtRole || data.role || "user",
            phone: data.phone,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("Profile sync error, signing out:", err);
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        syncingRef.current = false;
      }
    },
    [fetchUserProfile],
  );

  useEffect(() => {
    let mounted = true;

    // Eagerly resolve the current session — this is what makes new tabs
    // auto-login instantly instead of waiting for the async auth event.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        await syncProfile(session.user);
        if (mounted) setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    })();

    // Subscribe for real-time cross-tab events (login/logout from other tabs).
    // INITIAL_SESSION is intentionally skipped — getSession() above handles it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          await syncProfile(session.user);
          if (mounted) setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          syncingRef.current = false;
          if (mounted) setIsLoading(false);
        } else if (event === "TOKEN_REFRESHED") {
          if (mounted) setIsLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile, supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      syncingRef.current = false;
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const value = useMemo(
    () => ({ user, isLoading, signOut }),
    [user, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

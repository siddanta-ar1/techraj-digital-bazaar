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
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const syncingRef = useRef(false);

  // Build a minimal user object directly from the auth JWT.
  // Used immediately so the UI never flashes a logged-out state while the
  // DB round-trip is in flight.
  const buildUserFromAuth = useCallback((authUser: any): User => ({
    id: authUser.id,
    email: authUser.email || "",
    full_name:
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "User",
    avatar_url:
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      undefined,
    wallet_balance: 0,
    role: (authUser.app_metadata?.role as "user" | "admin") || "user",
    phone: authUser.user_metadata?.phone,
    is_synced: false,
  }), []);

  // Fetch user profile from public.users with retry.
  // NEVER throws — always returns { data, error }.
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
          await new Promise((r) => setTimeout(r, 600 * (retryCount + 1)));
          return fetchUserProfile(userId, retryCount + 1);
        }

        return { data, error };
      } catch (err) {
        if (retryCount < 2) {
          await new Promise((r) => setTimeout(r, 600 * (retryCount + 1)));
          return fetchUserProfile(userId, retryCount + 1);
        }
        return { data: null, error: err };
      }
    },
    [supabase],
  );

  // Sync profile from DB. Sets a minimal auth-only user immediately so the UI
  // is never in a logged-out state while waiting for the DB. If the DB fetch
  // fails for any reason, the auth session is KEPT — we never sign the user
  // out due to a DB error.
  const syncProfile = useCallback(
    async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      if (syncingRef.current) return;
      syncingRef.current = true;

      // Optimistically show the user as logged in using JWT data
      setUser(buildUserFromAuth(authUser));

      try {
        const { data } = await fetchUserProfile(authUser.id);

        if (data) {
          const jwtRole = authUser.app_metadata?.role as
            | "user"
            | "admin"
            | undefined;
          setUser({
            id: data.id,
            email: data.email || authUser.email,
            full_name:
              data.full_name ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0],
            avatar_url:
              authUser.user_metadata?.avatar_url ||
              authUser.user_metadata?.picture ||
              undefined,
            wallet_balance: data.wallet_balance ?? 0,
            role: jwtRole || data.role || "user",
            phone: data.phone,
            is_synced: true,
          });
        }
        // If data is null (DB error / user not in public.users yet), keep the
        // auth-only user that was already set above. is_synced stays false so
        // wallet shows 0 rather than a stale value.
      } catch (err) {
        // Ignore — the auth-only user is already set
        console.warn("[AuthProvider] profile sync error (session kept):", err);
      } finally {
        syncingRef.current = false;
      }
    },
    [buildUserFromAuth, fetchUserProfile],
  );

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange is the single authoritative source. It always fires
    // INITIAL_SESSION on mount (synchronously after subscription), so there is
    // no need for a separate getSession() call that can race with events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        switch (event) {
          case "INITIAL_SESSION":
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (session?.user) {
              await syncProfile(session.user);
            } else {
              setUser(null);
            }
            if (mounted) setIsLoading(false);
            break;

          case "SIGNED_OUT":
            setUser(null);
            syncingRef.current = false;
            if (mounted) setIsLoading(false);
            break;

          default:
            break;
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

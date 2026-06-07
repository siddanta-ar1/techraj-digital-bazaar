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
  // Explicitly re-fetches wallet_balance from DB.
  // Call this after actions that change the balance (checkout, topup submission)
  // to get an immediate update without waiting for the Realtime event.
  refreshBalance: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshBalance: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const syncingRef = useRef(false);
  // Holds the most recent authUser that arrived while a sync was in flight.
  // Checked in the finally block so the latest data is never permanently lost.
  const pendingAuthUserRef = useRef<any>(null);
  // Stable ref to current user id so refreshBalance / channel handler can
  // access it without becoming stale.
  const userIdRef = useRef<string | null>(null);

  // Keep userIdRef in sync with state.
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

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

      if (syncingRef.current) {
        // Queue this authUser so the in-flight sync retries with the latest data
        pendingAuthUserRef.current = authUser;
        return;
      }
      syncingRef.current = true;
      pendingAuthUserRef.current = null;

      // Optimistically show the user as logged in using JWT data and unblock the
      // UI immediately — is_synced:false keeps the wallet showing "..." until the
      // DB round-trip finishes. setIsLoading(false) here instead of after the DB
      // fetch means new tabs and checkout don't spin for 200-400ms unnecessarily.
      setUser(buildUserFromAuth(authUser));
      setIsLoading(false);

      try {
        const { data, error } = await fetchUserProfile(authUser.id);

        if (data) {
          // Spread the JWT-derived base so metadata fields (avatar_url, role,
          // full_name fallback) are handled in one place — buildUserFromAuth.
          const base = buildUserFromAuth(authUser);
          setUser({
            ...base,
            email: data.email || base.email,
            full_name: data.full_name || base.full_name,
            wallet_balance: data.wallet_balance ?? 0,
            phone: data.phone,
            is_synced: true,
          });
        } else if (!error) {
          // data is null with no error = .maybeSingle() found no row.
          // This is a new/unprovisioned user — Rs. 0 is the correct balance.
          setUser((prev) => (prev ? { ...prev, is_synced: true } : null));
        }
        // If error is non-null, all retries were exhausted against an unreachable DB.
        // Leave is_synced: false so the dropdown shows "..." rather than a false "Rs. 0".
        // The Realtime channel or next auth event will re-sync when connectivity returns.
      } catch (err) {
        // Unexpected throw (e.g. network failure before any retry). Keep is_synced: false
        // so the wallet shows "..." rather than incorrectly claiming the balance is Rs. 0.
        console.warn("[AuthProvider] profile sync error (session kept):", err);
      } finally {
        syncingRef.current = false;
        // If a newer event arrived while we were syncing, run it now so the
        // latest wallet balance / role is never permanently lost.
        const pending = pendingAuthUserRef.current;
        if (pending) {
          pendingAuthUserRef.current = null;
          syncProfile(pending);
        }
      }
    },
    [buildUserFromAuth, fetchUserProfile],
  );

  // Explicitly re-fetches wallet_balance from the DB.
  // Useful for immediate UI feedback after checkout or topup submission without
  // waiting for the Realtime channel to fire.
  const refreshBalance = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    const { data, error } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[AuthProvider] refreshBalance failed — balance may be stale:", error.message);
      return;
    }
    if (data && typeof data.wallet_balance === "number") {
      setUser((prev) =>
        prev ? { ...prev, wallet_balance: data.wallet_balance } : null,
      );
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    // Supabase Realtime channel that listens for wallet_balance changes on the
    // current user's row in public.users. Keeps the dropdown balance in sync
    // after orders are placed, topups are approved, or admin adjustments are made —
    // all of which update the DB without triggering an auth event.
    let walletChannel: ReturnType<typeof supabase.channel> | null = null;

    const teardownWalletChannel = () => {
      if (walletChannel) {
        supabase.removeChannel(walletChannel);
        walletChannel = null;
      }
    };

    const setupWalletChannel = (userId: string) => {
      // TOKEN_REFRESHED fires every ~55 min. Skip recreation if the channel is
      // already live — avoids an unnecessary DB round-trip and the brief ~100ms
      // window where a push update could be missed during teardown/resubscribe.
      if (walletChannel) return;
      walletChannel = supabase
        .channel(`user-balance-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${userId}`,
          },
          (payload: any) => {
            if (!mounted) return;
            if (typeof payload.new?.wallet_balance !== "number") {
              // wallet_balance missing from payload — table replica identity may not be FULL.
              // Run via: ALTER TABLE public.users REPLICA IDENTITY FULL;
              console.warn("[AuthProvider] wallet Realtime payload missing wallet_balance — replica identity may not be FULL");
              return;
            }
            setUser((prev) =>
              prev
                ? { ...prev, wallet_balance: payload.new.wallet_balance }
                : null,
            );
          },
        )
        .subscribe();
    };

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
              // isLoading is already set to false inside syncProfile as soon as
              // the optimistic user is available — no need to set it again here.
              if (mounted) setupWalletChannel(session.user.id);
            } else {
              setUser(null);
              teardownWalletChannel();
              if (mounted) setIsLoading(false);
            }
            break;

          case "SIGNED_OUT":
            setUser(null);
            syncingRef.current = false;
            teardownWalletChannel();
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
      teardownWalletChannel();
    };
  }, [syncProfile, supabase]);

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
    () => ({ user, isLoading, signOut, refreshBalance }),
    [user, isLoading, signOut, refreshBalance],
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

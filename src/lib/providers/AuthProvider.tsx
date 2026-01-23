"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

export type User = {
  id: string;
  email: string;
  full_name?: string;
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
  const router = useRouter();

  // Fetch profile with robust retry logic for "First Login" cold starts
  const fetchUserProfile = useCallback(
    async (
      userId: string,
      retryCount = 0,
    ): Promise<{ data: any; error: any }> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Retry up to 3 times (approx 2.5s total wait) to allow DB triggers to fire
      if ((error || !data) && retryCount < 3) {
        // Exponential backoff: 500ms, 1000ms, 1000ms
        const delay = retryCount === 0 ? 500 : 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchUserProfile(userId, retryCount + 1);
      }

      return { data, error };
    },
    [supabase],
  );

  const syncProfile = useCallback(
    async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      // 1. Prepare Optimistic / Fallback User
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || "",
        full_name:
          authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
        wallet_balance: 0,
        role: "user",
        is_synced: false,
      };

      try {
        // 2. Attempt to fetch real profile data
        const { data, error } = await fetchUserProfile(authUser.id);

        if (error || !data) {
          console.warn(
            "AuthProvider: Profile missing after retries (using fallback).",
            error,
          );
          // If we don't have a user yet, set the fallback to unblock the UI
          setUser((prev) => (prev ? prev : fallbackUser));
        } else {
          // 3. Success: Merge DB data
          setUser({
            ...fallbackUser,
            ...data,
            wallet_balance: data.wallet_balance ?? 0,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("AuthProvider: Sync error", err);
        // Safety net: ensure user is set so loading stops
        setUser((prev) => (prev ? prev : fallbackUser));
      }
    },
    [fetchUserProfile],
  );

  useEffect(() => {
    let mounted = true;

    // SINGLE SOURCE OF TRUTH: The Auth State Listener
    // This fires immediately with the current session state, replacing the need for a separate `initialize()` call.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        // Handle login or update
        await syncProfile(session.user);
      } else {
        // Handle logout
        setUser(null);
        if (event === "SIGNED_OUT") {
          router.refresh();
        }
      }

      // Always turn off loading after handling the event
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, syncProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, isLoading, signOut }),
    [user, isLoading],
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

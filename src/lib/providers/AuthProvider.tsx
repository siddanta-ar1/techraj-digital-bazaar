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
  useRef,
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
  const initRef = useRef(false);

  const fetchUserProfile = async (
    userId: string,
    retryCount = 0,
  ): Promise<any> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // If no data found and we haven't retried yet, wait and retry once
    // This fixes the race condition where Auth is ready but DB Trigger isn't
    if ((error || !data) && retryCount < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      return fetchUserProfile(userId, retryCount + 1);
    }

    return { data, error };
  };

  const syncProfile = useCallback(
    async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      // Default fallback state
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || "",
        full_name:
          authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
        wallet_balance: 0,
        role: "user", // Default role
        is_synced: false,
      };

      try {
        // Attempt to fetch with retry logic
        const { data, error } = await fetchUserProfile(authUser.id);

        if (error || !data) {
          console.warn(
            "AuthProvider: Profile sync failed or still creating.",
            error,
          );
          // Only set fallback if we don't have a user already, to prevent overwriting valid data with empty data
          setUser((prev) => (prev ? prev : fallbackUser));
        } else {
          setUser({
            ...fallbackUser,
            ...data, // This overwrites the default role/balance with DB values
            wallet_balance: data.wallet_balance ?? 0,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("AuthProvider: Critical sync error.", err);
        setUser(fallbackUser);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await syncProfile(session.user);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Re-sync on sign in, token refresh, or user update
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await syncProfile(session?.user);
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUser(null);
        router.refresh();
      }

      // Ensure loading is set to false after auth check completes
      if (mounted) setIsLoading(false);
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
      router.push("/login");
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

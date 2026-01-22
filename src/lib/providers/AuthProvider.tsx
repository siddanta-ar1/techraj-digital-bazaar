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
  // Ensure createClient is only called once per provider lifecycle
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Robust profile fetch with retry logic
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

      // Retry if data is missing or error occurs (up to 2 times)
      if ((error || !data) && retryCount < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500));
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

      // Default fallback state (Optimistic UI)
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
        const { data, error } = await fetchUserProfile(authUser.id);

        if (error || !data) {
          console.warn(
            "AuthProvider: Profile sync failed or user creation pending.",
            error,
          );
          // Preserve existing user state if available (prevents flashing), else use fallback
          setUser((prev) => (prev ? prev : fallbackUser));
        } else {
          setUser({
            ...fallbackUser,
            ...data, // Merges DB data (role, balance)
            wallet_balance: data.wallet_balance ?? 0,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("AuthProvider: Critical sync error.", err);
        setUser(fallbackUser);
      }
    },
    [fetchUserProfile],
  );

  useEffect(() => {
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
        // ✅ CRITICAL: Always turn off loading, even on error
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await syncProfile(session?.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
      }

      // Ensure loading is false after any auth event processing
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

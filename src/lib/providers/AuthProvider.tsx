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
  const isMounting = useRef(true);
  const syncingRef = useRef(false);

  // Fetch profile with robust retry logic
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

      if ((error || !data) && retryCount < 3) {
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
        syncingRef.current = false;
        return;
      }

      // Prevent concurrent sync operations
      if (syncingRef.current) return;
      syncingRef.current = true;

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
          console.warn("Using fallback profile due to fetch error");
          setUser((prev) => {
            // Only update if user ID changed or we don't have a user
            if (!prev || prev.id !== authUser.id) {
              return fallbackUser;
            }
            return prev;
          });
        } else {
          setUser({
            ...fallbackUser,
            ...data,
            wallet_balance: data.wallet_balance ?? 0,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("Sync error", err);
        setUser((prev) => {
          if (!prev || prev.id !== authUser.id) {
            return fallbackUser;
          }
          return prev;
        });
      } finally {
        syncingRef.current = false;
      }
    },
    [fetchUserProfile],
  );

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const initializeAuth = async () => {
      if (initialized) return;
      initialized = true;

      try {
        // 1. Explicitly check session first (Fixes infinite load)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            await syncProfile(session.user);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          isMounting.current = false;
        }
      }
    };

    // 2. Listen for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle initial session
      if (event === "INITIAL_SESSION") {
        if (!initialized) {
          initializeAuth();
        }
        return;
      }

      if (session?.user) {
        // Check if we need to sync this user
        const needsSync =
          !user || user.id !== session.user.id || !user.is_synced;

        if (
          needsSync &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          await syncProfile(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        syncingRef.current = false;
        router.refresh();
      }

      if (!isMounting.current) {
        setIsLoading(false);
      }
    });

    // Start initialization if not already started
    if (!initialized) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      syncingRef.current = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, syncProfile, user]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      syncingRef.current = false;
      await supabase.auth.signOut();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Signout error:", error);
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

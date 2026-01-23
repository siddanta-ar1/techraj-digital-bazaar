"use client";

import { createClient } from "@/lib/supabase/client";
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
  const isInitialized = useRef(false);
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
          console.warn("Profile fetch failed, using fallback");
          setUser(fallbackUser);
        } else {
          setUser({
            id: data.id,
            email: data.email,
            full_name: data.full_name || fallbackUser.full_name,
            wallet_balance: data.wallet_balance ?? 0,
            role: data.role || "user",
            phone: data.phone,
            is_synced: true,
          });
        }
      } catch (err) {
        console.error("Profile sync error:", err);
        setUser(fallbackUser);
      } finally {
        syncingRef.current = false;
      }
    },
    [fetchUserProfile],
  );

  // Initialize auth - runs only once
  useEffect(() => {
    if (isInitialized.current) return;

    let mounted = true;
    isInitialized.current = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            await syncProfile(session.user);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - runs only once

  // Listen for auth changes - separate from initialization
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip initial session - already handled by initAuth
      if (event === "INITIAL_SESSION") return;

      console.log("Auth event:", event);

      if (event === "SIGNED_IN" && session?.user) {
        await syncProfile(session.user);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        syncingRef.current = false;
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Only sync if we don't have user data or user changed
        const needsSync =
          !user || user.id !== session.user.id || !user.is_synced;
        if (needsSync) {
          await syncProfile(session.user);
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, syncProfile, user?.id, user?.is_synced]);

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

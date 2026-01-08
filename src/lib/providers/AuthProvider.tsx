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

type User = {
  id: string;
  email: string;
  full_name?: string;
  wallet_balance: number;
  role: "user" | "admin";
  phone?: string;
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

  // Synchronizes the user profile with a 5-second safety timeout
  const syncProfile = useCallback(
    async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      // Default fallback user object derived from Auth metadata
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || "",
        full_name:
          authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
        wallet_balance: 0.0,
        role: "user",
      };

      try {
        // Race the DB query against a timeout promise
        const { data, error } = await Promise.race([
          supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("DB_TIMEOUT")), 5000),
          ),
        ]);

        if (error || !data) {
          setUser(fallbackUser);
        } else {
          setUser(data as User);
        }
      } catch (err) {
        // Silently handle timeout/errors and use fallback to prevent UI hang
        console.warn(
          "AuthProvider: Using fallback profile due to latency or error.",
        );
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
        // Use getSession for fast client-side hydration
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
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await syncProfile(session?.user);
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUser(null);
        router.refresh();
      }
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

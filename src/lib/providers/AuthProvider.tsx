"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

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

  // FIX: Create a stable supabase instance that doesn't change on re-renders
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const getOrCreateUser = async (authUser: any) => {
    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (existingUser) return existingUser as User;

      const newUser = {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "",
        wallet_balance: 0.0,
        role: "user" as const,
      };

      // Try to upsert, but fallback to basic object if DB fails
      try {
        const { data: createdUser } = await supabase
          .from("users")
          .upsert(newUser)
          .select()
          .single();
        return (createdUser as User) || newUser;
      } catch (dbError) {
        console.error("DB Upsert error:", dbError);
        return newUser;
      }
    } catch (error) {
      console.error("User fetch error:", error);
      return {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "",
        wallet_balance: 0.0,
        role: "user" as const,
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            const userData = await getOrCreateUser(session.user);
            if (mounted) setUser(userData);
          } else {
            // No session found
            if (mounted) setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        // ALWAYS turn off loading, even if errors occur
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only react to specific events to avoid redundant updates
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          const userData = await getOrCreateUser(session.user);
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
          }
        }
      } else if (event === "SIGNED_OUT") {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: Empty dependency array to run only once on mount

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

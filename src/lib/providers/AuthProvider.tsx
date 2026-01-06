"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  const router = useRouter();
  const pathname = usePathname();

  // Create Supabase client once
  const [supabase] = useState(() => createClient());

  const getOrCreateUser = useCallback(
    async (authUser: any) => {
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

        const { data: createdUser, error } = await supabase
          .from("users")
          .upsert(newUser)
          .select()
          .single();

        if (error) throw error;

        return (createdUser as User) || newUser;
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
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    async function syncUser(sessionUser: any) {
      if (!sessionUser) {
        if (mounted) setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profile) {
        if (mounted) setUser(profile as User);
      } else {
        // Fallback for new users (e.g. Google OAuth users not yet in DB)
        const newUser: User = {
          id: sessionUser.id,
          email: sessionUser.email || "",
          full_name: sessionUser.user_metadata?.full_name || "",
          wallet_balance: 0,
          role: "user",
        };

        const { data: created } = await supabase
          .from("users")
          .upsert(newUser)
          .select()
          .single();

        if (mounted) setUser((created as User) || newUser);
      }
    }

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await syncUser(session?.user);
      if (mounted) setIsLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await syncUser(session?.user);
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
  }, [supabase, router]);

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

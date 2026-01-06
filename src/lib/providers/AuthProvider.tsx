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

  // FIX: Create a stable supabase instance that doesn't change on re-renders
  const [supabase] = useState(() => createClient());
  const router = useRouter();
<<<<<<< HEAD
=======
  const pathname = usePathname();
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)

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

<<<<<<< HEAD
      // Try to upsert, but fallback to basic object if DB fails
      try {
        const { data: createdUser } = await supabase
=======
        const newUser = {
          id: authUser.id,
          email: authUser.email || "",
          full_name: authUser.user_metadata?.full_name || "",
          wallet_balance: 0.0,
          role: "user" as const,
        };

        const { data: createdUser, error } = await supabase
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)
          .from("users")
          .upsert(newUser)
          .select()
          .single();
<<<<<<< HEAD
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
=======

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
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)

  useEffect(() => {
    let mounted = true;

<<<<<<< HEAD
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
=======
    async function syncUser(sessionUser: any) {
      if (!sessionUser) {
        if (mounted) setUser(null);
        return;
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)
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
      // Only react to specific events to avoid redundant updates
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
<<<<<<< HEAD
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
=======
        await syncUser(session?.user);
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUser(null);
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)
        router.refresh();
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: Empty dependency array to run only once on mount
=======
  }, [supabase, router]);
>>>>>>> 962b31a (Dashboard inconsistency fixed, products page and marquee bug fixed)

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

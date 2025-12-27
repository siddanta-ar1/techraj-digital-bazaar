'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  full_name?: string
  wallet_balance: number
  role: 'user' | 'admin'
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Simple function to get or create user
  const getOrCreateUser = async (authUser: any) => {
    try {
      // Try to get user from public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (existingUser) {
        return existingUser as User
      }

      // Create new user if doesn't exist
      const newUser = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        wallet_balance: 0.00,
        role: 'user' as const,
      }

      const { data: createdUser } = await supabase
        .from('users')
        .upsert(newUser)
        .select()
        .single()

      return createdUser as User || newUser

    } catch (error) {
      console.log('Error in getOrCreateUser (non-critical):', error)
      // Return basic user info even if database fails
      return {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        wallet_balance: 0.00,
        role: 'user' as const,
      }
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const userData = await getOrCreateUser(session.user)
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.log('Auth check error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (session?.user) {
          const userData = await getOrCreateUser(session.user)
          setUser(userData)
        } else {
          setUser(null)
        }
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
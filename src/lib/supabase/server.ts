import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore because middleware
            // handles session refresh and sets the updated cookies on the response.
          }
        },
      },
    }
  )
}

// Uses ESM import (not require) so it works on Edge Runtime and strict ESM builds.
// The service role key bypasses RLS — only use server-side, never expose to the client.
export function createAdminClient() {
  return createSupabaseClient(
    env.supabaseUrl,
    env.supabaseServiceRoleKey
  )
}

import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure consistent session state across tabs
let supabaseClientSingleton: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClientSingleton
}
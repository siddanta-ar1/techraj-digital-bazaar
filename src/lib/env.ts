/**
 * Environment variable validation — checked at module load time.
 *
 * Importing this module from any server-side entry point (layout, route, etc.)
 * causes the process to throw with a clear diagnostic message if a required
 * variable is missing, rather than surfacing a cryptic runtime error mid-request.
 *
 * Variables prefixed NEXT_PUBLIC_* are also validated here; their absence would
 * produce a silent undefined rather than a startup failure.
 */

const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "ADMIN_EMAIL",
] as const;

const OPTIONAL_SERVER_ENV = [
  "NEXT_PUBLIC_CONTACT_PHONE",
] as const;

function validateEnv() {
  const missing = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n` +
      missing.map((k) => `  - ${k}`).join("\n") +
      `\n\nCheck your .env.local file or deployment environment.`,
    );
  }
}

// Only run validation on the server — process.env is not available in Edge
// Runtime with the same semantics, and NEXT_PUBLIC_ vars are inlined at build.
if (typeof window === "undefined") {
  validateEnv();
}

// Typed accessors — narrow the type to string (not string | undefined) after validation
export const env = {
  supabaseUrl:           process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey:       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  resendApiKey:          process.env.RESEND_API_KEY!,
  adminEmail:            process.env.ADMIN_EMAIL!,
  contactPhone:          process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
} as const;

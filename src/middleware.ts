import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase's server — never use getSession() here.
  // This call also refreshes the token when it's near expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/refund");
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname === "/auth/callback";

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    if (path === "/login" && (isAdminPage || isProtectedPage)) {
      url.searchParams.set("redirect", pathname);
    }
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((c) => res.cookies.set(c.name, c.value, c));
    return res;
  };

  if (!user) {
    if (isAdminPage || isProtectedPage) return redirect("/login");
    return supabaseResponse;
  }

  // Role from JWT app_metadata — no DB query needed.
  // Run the backfill SQL below once to populate existing admins.
  const role = user.app_metadata?.role as string | undefined;

  if (isAdminPage && role !== "admin") return redirect("/dashboard");

  if (isAuthPage) return redirect("/dashboard");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

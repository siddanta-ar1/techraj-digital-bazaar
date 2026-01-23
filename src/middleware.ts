import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if needed - this handles token refresh automatically
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const url = request.nextUrl.clone();
  const isAuthPage =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register") ||
    url.pathname.startsWith("/auth/callback");

  const isProtectedPage =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/refund");

  // Helper function to create redirect with preserved cookies
  const createRedirect = (path: string) => {
    const redirectUrl = url.clone();
    redirectUrl.pathname = path;

    // Preserve redirect parameter for login
    if (path === "/login" && isProtectedPage) {
      redirectUrl.searchParams.set("redirect", url.pathname);
    }

    const response = NextResponse.redirect(redirectUrl);

    // Copy all cookies from supabase response to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
  };

  // Handle authentication error (expired/invalid session)
  if (error) {
    console.log("Auth error in middleware:", error.message);

    if (isProtectedPage) {
      return createRedirect("/login");
    }

    // Clear invalid session cookies
    if (
      error.message.includes("session_not_found") ||
      error.message.includes("invalid")
    ) {
      supabaseResponse.cookies.delete("sb-access-token");
      supabaseResponse.cookies.delete("sb-refresh-token");
    }
  }

  // User is authenticated
  if (session?.user) {
    // Redirect authenticated users away from auth pages
    if (isAuthPage && !url.pathname.includes("/auth/callback")) {
      const redirectTo = url.searchParams.get("redirect") || "/dashboard";
      return createRedirect(redirectTo);
    }

    // Allow access to protected pages
    return supabaseResponse;
  }

  // User is not authenticated
  if (!session) {
    // Block access to protected pages
    if (isProtectedPage) {
      return createRedirect("/login");
    }

    // Allow access to public and auth pages
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

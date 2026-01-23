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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // This refreshes the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Helper: Ensure cookies travel with redirects
  const safeRedirect = (path: string) => {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = path;
    // Preserve query params if needed (e.g. ?redirect=...)
    if (path === "/login" && url.pathname !== "/") {
      newUrl.searchParams.set("redirect", url.pathname);
    }

    const response = NextResponse.redirect(newUrl);

    // CRITICAL: Copy cookies from supabaseResponse (which has the fresh session)
    // to the new redirect response
    const cookiesToSet = supabaseResponse.cookies.getAll();
    cookiesToSet.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
  };

  // 1. Auth Pages (Login/Register)
  if (
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    if (user) {
      // User is already logged in -> Go to Dashboard
      const redirectTarget = url.searchParams.get("redirect") || "/dashboard";
      // We manually construct the URL here because safeRedirect handles the base logic
      const targetUrl = new URL(redirectTarget, request.url);
      const response = NextResponse.redirect(targetUrl);

      // Copy cookies
      supabaseResponse.cookies.getAll().forEach((c) => {
        response.cookies.set(c.name, c.value, c);
      });

      return response;
    }
    return supabaseResponse;
  }

  // 2. Protected Pages
  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/refund")
  ) {
    if (!user) {
      // User not logged in -> Go to Login
      return safeRedirect("/login");
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

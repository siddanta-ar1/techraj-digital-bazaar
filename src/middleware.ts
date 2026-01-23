// src/middleware.ts
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // --- FIX START: Helper to carry cookies to redirects ---
  const redirect = (to: URL | string) => {
    const newResponse = NextResponse.redirect(to);
    // Copy cookies from the response where Supabase might have refreshed tokens
    newResponse.cookies.getAll().forEach((c) => {
      newResponse.cookies.set(c.name, c.value, c);
    });
    // Copy cookies from supabaseResponse (the critical part)
    supabaseResponse.cookies.getAll().forEach((c) => {
      newResponse.cookies.set(c.name, c.value, c);
    });
    return newResponse;
  };
  // --- FIX END ---

  // Auth pages
  if (
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    if (user) {
      const redirectTarget = url.searchParams.get("redirect");
      if (redirectTarget) {
        return redirect(new URL(redirectTarget, request.url)); // Use helper
      }
      url.pathname = "/dashboard";
      return redirect(url); // Use helper
    }
    return supabaseResponse;
  }

  // Protected pages
  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/refund")
  ) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", url.pathname);
      return redirect(loginUrl); // Use helper
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

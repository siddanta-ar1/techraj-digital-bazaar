import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Create response ONCE
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
          // Update request cookies (for immediate use)
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );

          // Update response cookies (for browser)
          // FIX: Do NOT recreate NextResponse here. Just set the cookies on the existing object.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Check User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Handle Route Protection
  const url = request.nextUrl.clone();

  // Auth pages (Login/Register)
  if (
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    if (user) {
      // If logged in, go to dashboard
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected pages (Dashboard/Admin)
  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin")
  ) {
    if (!user) {
      // If not logged in, go to login
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

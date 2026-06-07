import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Per-edge-node maintenance cache — avoids a DB round-trip on every request.
// TTL of 30 s means maintenance mode propagates to all nodes within ~30 s of toggle.
let _mc: { active: boolean; ts: number } | null = null;

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

  const { pathname } = request.nextUrl;

  const isAdminPage     = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAuthApiRoute  = pathname.startsWith("/api/auth");
  const isMaintenancePage = pathname === "/maintenance";
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/checkout");
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname === "/auth/callback";
  const isApiRoute = pathname.startsWith("/api");

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

  // ── Maintenance check (module-level cache, O(1) on cache hit) ────────────
  const now = Date.now();
  let isUnderMaintenance = false;
  if (_mc && now - _mc.ts < 30_000) {
    isUnderMaintenance = _mc.active;
  } else {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle();
    isUnderMaintenance = data?.value?.active === true;
    _mc = { active: isUnderMaintenance, ts: now };
  }

  // ── Fast path ─────────────────────────────────────────────────────────────
  // getUser() is a Supabase Auth network call (~100 ms). Skip it entirely for
  // public routes when maintenance is off — the vast majority of all requests.
  // Auth state for these pages is managed client-side by AuthProvider.
  const needsAuthCheck =
    isUnderMaintenance ||
    isAdminPage ||
    isAdminApiRoute ||
    isProtectedPage ||
    isAuthPage;

  if (!needsAuthCheck) {
    return supabaseResponse;
  }

  // ── Auth check (only when necessary) ─────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;

  if (
    isUnderMaintenance &&
    !isAdminPage &&
    !isAdminApiRoute &&
    !isAuthPage &&
    !isAuthApiRoute &&
    !isMaintenancePage &&
    role !== "admin"
  ) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Service temporarily unavailable for maintenance" },
        { status: 503 },
      );
    }
    return redirect("/maintenance");
  }

  if (!user) {
    if (isAdminPage || isProtectedPage) return redirect("/login");
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return supabaseResponse;
  }

  if (isAdminPage && role !== "admin") return redirect("/dashboard");
  if (isAdminApiRoute && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAuthPage) return redirect("/dashboard");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

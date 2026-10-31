import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

interface FastUser {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Fast-path: Extracts unexpired user session directly from Supabase cookies in <0.1ms.
 * Avoids blocking HTTP network roundtrips to remote Supabase Auth servers on every page click.
 */
function getFastUserFromCookies(request: NextRequest): FastUser | null {
  try {
    const allCookies = request.cookies.getAll();
    const authCookies = allCookies.filter((c) => c.name.includes("-auth-token"));
    if (authCookies.length === 0) return null;

    authCookies.sort((a, b) => a.name.localeCompare(b.name));
    let raw = authCookies.map((c) => c.value).join("");
    if (!raw) return null;

    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf8");
    }

    const session = JSON.parse(raw);
    const token = session.access_token || (Array.isArray(session) ? session[0] : null);
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    const nowSec = Math.floor(Date.now() / 1000);
    // If token expired or expiring in under 30s, return null so full refresh takes place
    if (payload.exp && payload.exp < nowSec + 30) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email || session.user?.email,
      role: payload.user_metadata?.role || session.user?.user_metadata?.role,
      user_metadata: payload.user_metadata || session.user?.user_metadata || {},
    };
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const { nextUrl } = request;

  // Skip session redirection for public APIs and billing triggers
  if (nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/reset-password");
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/products") ||
    nextUrl.pathname.startsWith("/plans") ||
    nextUrl.pathname.startsWith("/subscriptions") ||
    nextUrl.pathname.startsWith("/invoices") ||
    nextUrl.pathname.startsWith("/payments") ||
    nextUrl.pathname.startsWith("/customers") ||
    nextUrl.pathname.startsWith("/staff");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");

  // 1. High-speed local token parse (<0.1ms)
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null =
    getFastUserFromCookies(request);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Fall back to remote Supabase refresh only if needed
  if (!user && (isDashboardRoute || isPortalRoute || isAuthRoute)) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options: CookieOptions;
            }>
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  }

  // Determine user role from metadata, or fallback to email pattern
  let role = user?.user_metadata?.role as string | undefined;
  if (!role && user?.email) {
    if (user.email.toLowerCase().startsWith("admin@")) {
      role = "admin";
    } else if (user.email.toLowerCase().startsWith("staff@")) {
      role = "staff";
    } else if (user.email.toLowerCase().startsWith("customer@")) {
      role = "customer";
    }
  }

  // Pass user headers downstream so layouts and server components avoid redundant remote getUser()
  if (user) {
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("x-user-id", user.id);
    reqHeaders.set("x-user-email", user.email || "");
    reqHeaders.set("x-user-role", role || "admin");

    supabaseResponse = NextResponse.next({
      request: {
        headers: reqHeaders,
      },
    });
  }

  // 1. If user is logged in and visits login/register, redirect them to home view
  if (isAuthRoute) {
    if (user && !nextUrl.pathname.startsWith("/reset-password")) {
      const url = request.nextUrl.clone();
      url.pathname = role === "customer" ? "/portal" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Unauthenticated user trying to access protected routes
  if (!user && (isDashboardRoute || isPortalRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 3. Customers cannot access internal admin/staff dashboard routes
  if (isDashboardRoute && role === "customer") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  // 4. Staff/Admin visiting customer portal get redirected to dashboard
  if (isPortalRoute && role && role !== "customer") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 5. Only Admins can access staff & team management
  if (nextUrl.pathname.startsWith("/staff") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

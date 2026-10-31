import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // If Supabase credentials are not configured yet, allow public access without crashing
    return supabaseResponse;
  }

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

  // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { nextUrl } = request;
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/products") ||
    nextUrl.pathname.startsWith("/plans") ||
    nextUrl.pathname.startsWith("/subscriptions") ||
    nextUrl.pathname.startsWith("/invoices") ||
    nextUrl.pathname.startsWith("/payments") ||
    nextUrl.pathname.startsWith("/customers");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");

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

  // 1. If user is logged in and visits login/register, redirect them to their home view
  if (isAuthRoute) {
    if (user) {
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

  return supabaseResponse;
}

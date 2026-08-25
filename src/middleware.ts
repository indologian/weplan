import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/shared/lib/supabase/middleware-client";

/**
 * OpenNext compatibility exception: Next.js 16 Proxy is Node-only, while
 * OpenNext Cloudflare currently supports the legacy Edge Middleware runtime.
 * Keep this boundary limited to session refresh and optimistic route gating.
 */
export async function middleware(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);
  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname === "/create" ||
    pathname.startsWith("/settings");

  if (needsAuth && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/create", "/settings/:path*"],
};

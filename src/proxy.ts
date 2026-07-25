import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (cacheHeaders) {
            Object.entries(cacheHeaders).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value as string),
            );
          }
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/staff') || pathname.startsWith('/admin');

  if (!isProtectedRoute) return supabaseResponse;

  // Validate JWT locally — no network call
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;

  if (!claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Read role from JWT app_metadata or user_metadata with admin email fallback
  const appMeta = claims['app_metadata'] as Record<string, unknown> | undefined;
  const userMeta = claims['user_metadata'] as Record<string, unknown> | undefined;
  const email = claims['email'] as string | undefined;

  const role =
    (appMeta?.['role'] as string | undefined) ??
    (userMeta?.['role'] as string | undefined) ??
    (email === 'admin@stowaway.lk' ? 'superadmin' : 'staff');

  if (pathname.startsWith('/admin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/staff', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
};

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // Apply cache headers to prevent CDN session leaks
          if (cacheHeaders) {
            Object.entries(cacheHeaders).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value as string),
            );
          }
        },
      },
    },
  );

  // Refresh session using getClaims() — validates JWT locally via WebCrypto
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/staff') || pathname.startsWith('/admin');

  if (isProtectedRoute && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && claims) {
    const userId = (claims as { sub?: string }).sub;
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!staff || (staff as { role?: string }).role !== 'superadmin') {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
};

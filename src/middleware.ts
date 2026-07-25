import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/staff') || pathname.startsWith('/admin');

  if (!isProtectedRoute) {
    return NextResponse.next({ request });
  }

  // Check demo/seed role cookie first (set by login page)
  const roleCookie = request.cookies.get('stowaway-staff-role');
  if (roleCookie) {
    const role = roleCookie.value;
    // If trying to access /admin but only has staff role, redirect to /staff
    if (pathname.startsWith('/admin') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
    return NextResponse.next({ request });
  }

  // If Supabase env vars are properly configured, verify session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT_ID') && supabaseKey;

  if (isSupabaseConfigured) {
    try {
      const { createServerClient } = await import('@supabase/ssr');
      let supabaseResponse = NextResponse.next({ request });

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (pathname.startsWith('/admin')) {
        const { data: staff } = await supabase
          .from('staff')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!staff || staff.role !== 'superadmin') {
          return NextResponse.redirect(new URL('/staff', request.url));
        }
      }

      return supabaseResponse;
    } catch {
      // Supabase error — allow pass-through
      return NextResponse.next({ request });
    }
  }

  // Supabase not configured: allow all pass-through (seed/demo mode)
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
};

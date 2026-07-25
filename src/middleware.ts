import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/staff') || pathname.startsWith('/admin');

  if (isProtectedRoute) {
    // Check for demo bypass cookie (set during demo login)
    const demoCookie = request.cookies.get('stowaway-demo-role');
    if (demoCookie) {
      const role = demoCookie.value;
      if (pathname.startsWith('/admin') && role !== 'superadmin') {
        return NextResponse.redirect(new URL('/staff', request.url));
      }
      return supabaseResponse;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      // Check role for admin routes
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
    } catch {
      // Supabase not configured — allow pass-through for demo
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
};

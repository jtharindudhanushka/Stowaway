import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/staff') || pathname.startsWith('/admin');

  if (!isProtectedRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // Verify authenticated Supabase session
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // Not authenticated — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // For admin routes: verify superadmin role from staff table
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
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
};

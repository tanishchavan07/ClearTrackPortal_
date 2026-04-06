import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Allow auth/callback to pass through freely
  if (pathname.includes('/auth/callback')) return response

  // Public/Marketing/Login pages
  const isLoginPage = pathname.startsWith('/auth/login')
  const isOnboardingPage = pathname.startsWith('/onboarding')
  
  if (!user) {
    // If not logged in and visiting protected routes, redirect to login
    if (!isLoginPage && !isOnboardingPage && pathname !== '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  // User is logged in, fetch role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'client'

  if (role === 'client') {
    // Clients skip admin and login
    if (pathname.startsWith('/admin') || isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (role === 'admin' || role === 'team') {
    // Admins/Team skip login and go to admin dashboard
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

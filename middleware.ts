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
  let { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fallback 1: check by email (handles pre-created clients with different ID)
  if (!profile && user.email) {
    const { data: emailProfile } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
    if (emailProfile) profile = emailProfile
  }

  // Fallback 2: check auth metadata (useful for immediate identification after invite)
  const role = profile?.role?.toLowerCase() || (user.user_metadata?.role as string)?.toLowerCase()

  // PROBLEM 2 FIX - Middleware role tracing and strict redirects
  console.log('middleware role:', role, 'path:', pathname)

  if (role === 'client') {
    // Clients skip admin area
    if (pathname.startsWith('/admin')) {
      console.log('middleware: client blocked from admin. redirecting to /')
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Clients skip login page
    if (pathname === '/auth/login') {
      console.log('middleware: logged in client at login. redirecting to /')
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (role === 'admin' || role === 'team') {
    // Admins/Team skip login and root (they go to admin dashboard)
    if (pathname === '/auth/login' || pathname === '/') {
      console.log('middleware: staff at login/root. redirecting to /admin')
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

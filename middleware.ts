import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  /**
   * IMPORTANT: `response` must be the object that cookies are set on AND
   * returned. Re-creating it inside setAll (old pattern) caused cookies to
   * be written to a new response that was then discarded.
   */
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed session cookies to both the forwarded request and
          // the response so the browser and server stay in sync.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Always allow the auth callback through — Supabase needs it to exchange
  // the magic-link token for a session.
  if (pathname.startsWith('/auth/callback')) return response

  // Resolve the authenticated user via the server (not from a stale cookie
  // value) so the JWT is always verified on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ─── Unauthenticated users ──────────────────────────────────────────────
  if (!user) {
    const isPublic =
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/onboarding') ||
      // Allow the session-expired page without auth — users may land here
      // with an invalid/expired magic link and no active session.
      pathname.startsWith('/session-expired')
    if (!isPublic) {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // ─── Resolve role — single DB call, middleware is the ONLY place this
  //     happens so there is exactly one source of truth per request. ────────
  let role: string | undefined

  // Primary: look up by auth UID
  const { data: profileById } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileById?.role) {
    role = profileById.role.toLowerCase()
  } else if (user.email) {
    // Fallback: pre-created client rows matched by email before their
    // auth UID was synced.
    const { data: profileByEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
    if (profileByEmail?.role) {
      role = profileByEmail.role.toLowerCase()
    }
  }

  // If role is still unknown after both DB lookups we cannot safely route.
  // Send the user to login rather than silently defaulting to any role.
  if (!role) {
    console.warn('[middleware] Could not resolve role for user', user.id)
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Role-based route guards ─────────────────────────────────────────────
  const isClient = role === 'client'
  const isStaff = role === 'admin' || role === 'team'

  if (isClient) {
    // Redirect root to client-dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/client-dashboard', request.url))
    }
    // Block clients from the admin area entirely with a hard 404
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
    // Redirect clients away from the login/public pages (they are already signed in)
    if (pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/client-dashboard', request.url))
    }
  }

  if (isStaff) {
    if (pathname === '/' || pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Block staff from the client dashboard with a hard 404 securely
    if (pathname.startsWith('/client-dashboard')) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next.js internals and static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

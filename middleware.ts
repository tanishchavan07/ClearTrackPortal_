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
  // RULE 4: Middleware only handles unauthenticated users → redirect to login.
  // Role-based access control is handled entirely in layouts (server components).
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

  // ─── Authenticated users ─────────────────────────────────────────────────
  // RULE 4: Do NOT do role-based redirects here — let the layouts handle access.
  // The ONE exception: admin/team hitting '/' must be redirected to /admin
  // because app/(client)/page.tsx owns '/' and has no mechanism to redirect
  // *upward* to /admin without a server page. This is necessary because
  // Next.js docs forbid having both app/page.tsx and app/(client)/page.tsx
  // resolve to the same '/' URL (conflicting paths error).
  if (pathname === '/') {
    // Minimal role lookup for the root-path redirect only — UID-only, no email
    // fallback. If the UID has no matching row the user hasn't completed
    // onboarding yet; let (client)/layout.tsx redirect them to /auth/login.
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role?.toLowerCase()

    if (role === 'admin' || role === 'team') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // client or unknown role → let (client)/layout.tsx handle it.
    return response
  }

  // All other protected routes: let the layout server components
  // handle role-based access (notFound, redirect to login, etc.).
  return response
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next.js internals and static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

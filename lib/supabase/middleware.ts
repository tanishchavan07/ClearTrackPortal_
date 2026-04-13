import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session cookie and returns an updated response.
 * Route-level access control is handled entirely in the root middleware.ts;
 * this helper is responsible ONLY for keeping the session token fresh.
 */
export async function updateSession(request: NextRequest) {
  // A single response object that we mutate in-place so cookies are never lost.
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
          // Patch the request so downstream Server Components see the updated
          // cookies, and patch the response so the browser receives them.
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

  // Calling getUser() triggers a token refresh when the access token has
  // expired, which writes the new token via the setAll callback above.
  await supabase.auth.getUser()

  return response
}

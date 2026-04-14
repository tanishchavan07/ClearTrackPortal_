'use client'

/**
 * ErrorRedirectGuard
 *
 * Supabase encodes auth errors (e.g. expired / already-used magic links) in
 * the URL *hash* fragment, e.g.:
 *   /admin#error=access_denied&error_code=otp_expired&error_description=...
 *
 * Hash fragments are invisible to the server (middleware, Server Components)
 * so we must handle them here on the client, *before* any dashboard UI is
 * painted.  We do this with a hidden component rendered at the very top of
 * every protected layout.
 *
 * On mount:
 *  • Parse the hash.
 *  • If an `error_code` is present → redirect to /session-expired immediately.
 *  • Otherwise → do nothing; the normal dashboard renders.
 *
 * The component renders null so it never contributes any visible DOM.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function ErrorRedirectGuard() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleHash = async () => {
      const hash = window.location.hash
      if (!hash || hash.length <= 1) return

      // Strip the leading '#' and parse as URLSearchParams
      const params = new URLSearchParams(hash.slice(1))
      const errorCode = params.get('error_code')
      const error = params.get('error')

      if (errorCode || error === 'access_denied') {
        router.replace('/session-expired')
      }
    }

    handleHash()
  }, [router])

  return null
}

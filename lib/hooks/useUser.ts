'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/types'

/**
 * Returns the currently authenticated user's full profile from the DB.
 *
 * Design decisions:
 *  - queryKey includes the auth user's ID → each user has an isolated cache
 *    slot; no two users share stale data.
 *  - An auth-state listener removes stale entries when the identity changes,
 *    so a sign-out/sign-in cycle always fetches a fresh profile.
 *  - The query is disabled until we know the auth state (undefined = still
 *    resolving) so the UI never flashes a "no user" state on first render.
 *  - On DB lookup failure, null is returned — no role is ever fabricated.
 */
export function useUser() {
  const queryClient = useQueryClient()

  // undefined  = initial session not yet resolved (Supabase is async)
  // null        = confirmed signed-out
  // string      = confirmed signed-in user ID
  const [authUserId, setAuthUserId] = useState<string | null | undefined>(
    undefined
  )

  useEffect(() => {
    // Resolve the initial session from the browser's local token store.
    // getSession() is synchronous-ish (reads localStorage) so this runs fast.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUserId(session?.user?.id ?? null)
    })

    // Listen for auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    // and invalidate the per-user cache when the identity changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION fires synchronously on mount and is already handled
      // by the getSession() call above. Handling it here would double-set
      // authUserId and could cause a redundant re-fetch.
      if (event === 'INITIAL_SESSION') return

      const nextId = session?.user?.id ?? null

      setAuthUserId((prev) => {
        if (prev !== undefined && prev !== nextId) {
          // Drop the stale cache entry so the next fetch starts clean.
          queryClient.removeQueries({ queryKey: ['user'] })

          // ── Cross-tab login guard ────────────────────────────────────────
          // If a DIFFERENT authenticated user just took over the session
          // (e.g. someone logged in as admin in Tab B while this tab had a
          // client session), the server-rendered layout guard in this tab is
          // now stale. A full page reload forces the server layout to re-run
          // with the new cookie and apply the correct role gate — preventing
          // the "admin sees client UI" / "client sees admin UI" flip.
          if (prev !== null && nextId !== null && typeof window !== 'undefined') {
            window.location.reload()
            // Keep prev until the reload fires — avoids a flash of wrong UI.
            return prev
          }
        }
        return nextId
      })
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return useQuery<User | null>({
    // Per-user cache key — prevents role leakage between different accounts.
    queryKey: ['user', authUserId],

    // Do not fetch until we know who is signed in; avoids a wasted network
    // call and prevents a momentary null-user flash on initial render.
    enabled: authUserId !== undefined && authUserId !== null,

    queryFn: async () => {
      // Verify the JWT via the Supabase server — this is the authoritative
      // identity check and auto-refreshes the token if needed.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) return null

      // Primary: look up the full profile by the authenticated UID.
      const { data: profileById, error: byIdError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileById) return profileById as User

      // Fallback: pre-created client rows may still have the old email-based
      // identity before their auth UID was written into the users table.
      if (user.email) {
        const { data: profileByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()

        if (profileByEmail) return profileByEmail as User
      }

      // Profile genuinely not found — do NOT fabricate a role.
      console.error('[useUser] Profile not found for user', user.id, byIdError)
      return null
    },

    // 60 s is a good balance: UI stays fresh, but we don't hammer the DB.
    // The server layout re-verifies the role on every full navigation anyway.
    staleTime: 60 * 1000,
  })
}

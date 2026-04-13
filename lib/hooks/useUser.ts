'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/types'

export function useUser() {
  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return null

      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && user.email) {
        // Fallback 1: check by email
        const { data: emailData } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()
        
        if (emailData) {
          data = emailData
          error = null
        }
      }

      if (error || !data) {
        console.error('Error fetching user metadata:', error)
        // Fallback 2: return at least the auth identity if data lookup fails
        return {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'client',
          name: user.user_metadata?.name || user.email
        } as User
      }

      return data as User
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

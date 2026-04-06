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

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user metadata:', error)
        return null
      }

      return data as User
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

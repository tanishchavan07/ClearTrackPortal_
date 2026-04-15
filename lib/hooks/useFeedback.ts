'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useFeedback(projectId: string) {
  return useQuery({
    queryKey: ['feedback', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user:users!user_id (
            name,
            email,
            role
          )
        `)
        .eq('project_id', projectId)
        .eq('type', 'feedback')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as any[]
    },
    enabled: !!projectId,
  })
}

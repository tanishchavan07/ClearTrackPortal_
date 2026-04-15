'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ActivityItem } from '@/types'

export function useActivityFeed(projectId: string) {
  return useQuery({
    queryKey: ['activity', projectId],
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
        .neq('type', 'feedback')
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (error) throw error
      return data as (ActivityItem & { user: { name: string; email: string; role: string } })[]
    },
    enabled: !!projectId,
  })
}

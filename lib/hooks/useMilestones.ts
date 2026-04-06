'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Milestone } from '@/types'

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data as Milestone[]
    },
    enabled: !!projectId,
  })
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Milestone> }) => {
      const { error } = await supabase.from('milestones').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones', projectId] })
  })
}

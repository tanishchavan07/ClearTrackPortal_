'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Task } from '@/types'

export function useTasks(milestoneId?: string) {
  return useQuery({
    queryKey: ['tasks', milestoneId],
    queryFn: async () => {
      // If we don't have a specific milestone, we might be fetching all tasks for a board.
      // But typically we fetch per milestone or we can fetch all tasks for a project
      // For Kanban board, maybe we need project level tasks. Let's adjust to allow generic fetch or milestone specific.
      let query = supabase.from('tasks').select('*')
      if (milestoneId) {
        query = query.eq('milestone_id', milestoneId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
    // We only enable if it's called with milestoneId (or let it fetch all if needed, but safe to require it or a project_id)
    enabled: !!milestoneId,
  })
}

// An alternative for fetching ALL tasks in a project (joining through milestones)
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: async () => {
      // First get user milestones
      const { data: milestones, error: mErr } = await supabase
        .from('milestones')
        .select('id, title')
        .eq('project_id', projectId)
        
      if (mErr) throw mErr
      
      if (!milestones.length) return []
      
      const milestoneIds = milestones.map(m => m.id)
      
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('*')
        .in('milestone_id', milestoneIds)
        
      if (tErr) throw tErr
      
      // We can also attach milestone info to tasks for UI
      const tasksWithMilestone = tasks.map(t => ({
        ...t,
        milestoneTitle: milestones.find(m => m.id === t.milestone_id)?.title || 'Unknown'
      }))
      
      return tasksWithMilestone
    },
    enabled: !!projectId,
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projectTasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    }
  })
}
export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projectTasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    }
  })
}

'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useRealtime(projectId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    // If no project, we might just be listening globally (like on dashboard)
    // But typically we listen per project.
    
    // Subscribe to projects table
    let projectChannel = supabase.channel('public:projects')
      
    if (projectId) {
      projectChannel = projectChannel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['projects'] })
          toast.info('Project status updated')
        }
      )
    } else {
      projectChannel = projectChannel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['projects'] })
        }
      )
    }

    projectChannel.subscribe()

    // Subscribe to activity feed
    let activityChannel = supabase.channel('public:activity_feed')
    
    if (projectId) {
      activityChannel = activityChannel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed', filter: `project_id=eq.${projectId}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['activity', projectId] })
          
          // Show toast for certain high priority activities
          const action = payload.new.action
          if (action === 'file_upload' || action === 'comment') {
            toast('New activity on project', {
              description: payload.new.message
            })
          }
        }
      )
    }

    activityChannel.subscribe()

    return () => {
      supabase.removeChannel(projectChannel)
      supabase.removeChannel(activityChannel)
    }
  }, [projectId, qc])
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ProjectFile } from '@/types'

export function useFiles(projectId: string, folder?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['files', projectId, folder],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select(`
          *,
          user:users!uploaded_by (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (folder) {
        query = query.eq('folder', folder)
      }
        
      const { data, error } = await query
      if (error) throw error
      return data as (ProjectFile & { user: { name: string } })[]
    },
    enabled: !!projectId && enabled,
  })
}

export function useAddFile(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fileData: Omit<ProjectFile, 'id'>) => {
      const { data, error } = await supabase.from('files').insert(fileData).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files', projectId] })
    }
  })
}

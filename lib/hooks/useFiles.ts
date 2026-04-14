'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ProjectFile } from '@/types'

export function useFiles(
  projectId: string,
  folder?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['files', projectId, folder],

    queryFn: async () => {
      if (!projectId || !folder) return []

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .eq('folder', folder)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ProjectFile[]
    },

    enabled: !!projectId && !!folder && enabled,
    retry: false,
  })
}

export function useAddFile(projectId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (fileData: Omit<ProjectFile, 'id'>) => {
      const { data, error } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Project } from '@/types'

export default function EditProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjectWithClient = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:users!client_id(*)')
        .eq('id', projectId)
        .single()

      if (!error && data) {
        setProject({
          ...data,
          client_email: data.client?.email,
          client_name: data.client?.name
        })
      }
      setLoading(false)
    }

    if (projectId) fetchProjectWithClient()
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-gray-500">
        Project not found.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Project Settings</h1>
        <p className="text-gray-500 mt-1">Configure project {project.name} and client access</p>
      </div>

      <ProjectForm initialData={project} isEditing />
    </div>
  )
}

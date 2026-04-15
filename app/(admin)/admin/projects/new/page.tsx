'use client'

import { useUser } from '@/lib/hooks/useUser'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewProjectPage() {
  const { data: user, isLoading } = useUser()

  // Early return for non-admin users (admin layout also protects this)
  if (!isLoading && user?.role !== 'admin') {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-10 space-y-10 max-w-7xl mx-auto bg-white min-h-screen">
        <Skeleton className="h-[250px] w-full rounded-[40px]" />
        <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Project</h1>
        <p className="text-gray-500 mt-1">Set up a new client project workspace</p>
      </div>

      <ProjectForm />
    </div>
  )
}

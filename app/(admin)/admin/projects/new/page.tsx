'use client'

import { ProjectForm } from '@/components/admin/ProjectForm'

export default function NewProjectPage() {
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

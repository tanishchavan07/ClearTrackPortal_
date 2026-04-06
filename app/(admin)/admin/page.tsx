'use client'

import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useProjects } from '@/lib/hooks/useProjects'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, HealthBadge } from '@/components/dashboard/HealthBadge'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminOverviewPage() {
  const { data: projects, isLoading } = useProjects()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Projects</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all client projects across the agency</p>
        </div>
        <Link href="/admin/projects/new" className={buttonVariants({ variant: 'default', className: 'bg-blue-600 hover:bg-blue-700 w-full sm:w-auto' })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Link>
      </div>

      <div className="bg-white border md:rounded-xl shadow-sm border-gray-200 -mx-4 sm:mx-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search projects..." className="pl-9 w-full sm:max-w-xs" />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Project</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Client</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Progress</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Created</th>
                <th className="px-6 py-3 border-b border-gray-200 text-right uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-2 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : projects?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No projects found
                  </td>
                </tr>
              ) : (
                projects?.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]">
                      {project.client_id} {/* Ideally resolved to name */}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge status={project.status} />
                        <HealthBadge health={project.health} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/projects/${project.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' })}>
                          View
                        </Link>
                        <Link href={`/admin/projects/${project.id}/edit`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Project } from '@/types'
import { HealthBadge, StatusBadge } from './HealthBadge'
import { ProgressRing } from './ProgressRing'

interface ProjectCardProps {
  project: Project
  // In a full implementation, we'd pass in the next milestone fetched via useQuery
  // For now we'll accept it as an optional prop or mock it
  nextMilestoneTitle?: string
  nextMilestoneDueDate?: string
}

export function ProjectCard({ project, nextMilestoneTitle, nextMilestoneDueDate }: ProjectCardProps) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.status} />
              <HealthBadge health={project.health} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-4">
          <ProgressRing progress={project.progress} size={140} />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className="truncate max-w-[140px]">
              {nextMilestoneTitle || 'No active milestones'}
            </span>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View Project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

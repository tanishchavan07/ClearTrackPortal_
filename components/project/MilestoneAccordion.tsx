'use client'

import { format } from 'date-fns'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useMilestones } from '@/lib/hooks/useMilestones'
import { useTasks } from '@/lib/hooks/useTasks'
import { Milestone, Task } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddMilestoneModal } from './AddMilestoneModal'
import { AddTaskModal } from './AddTaskModal'
import { InlineAddTask } from './InlineAddTask'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function MilestoneAccordion({ projectId, isEditable }: { projectId: string, isEditable: boolean }) {
  const { data: milestones, isLoading } = useMilestones(projectId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="space-y-6">
        {isEditable && <AddMilestoneModal projectId={projectId} />}
        <div className="text-gray-500 py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No milestones yet.
        </div>
      </div>
    )
  }

  const queryClient = useQueryClient()

  const handleDeleteMilestone = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete milestone "${title}"? This will delete all tasks within it.`)) return

    try {
      const { error } = await supabase.from('milestones').delete().eq('id', id)
      if (error) throw error
      toast.success('Milestone deleted')
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete milestone')
    }
  }

  const statusColors = {
    'todo': 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'done': 'bg-green-100 text-green-700'
  }

  return (
    <div className="space-y-6">
      {isEditable && (
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Project Roadmap</h3>
           <AddMilestoneModal projectId={projectId} />
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Accordion className="w-full">
          {milestones.map((milestone) => (
            <AccordionItem key={milestone.id} value={milestone.id} className="border-b last:border-0 border-gray-100">
              <AccordionTrigger className="px-6 hover:no-underline hover:bg-gray-50 transition-colors">
                <div className="flex flex-1 items-center justify-between mr-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">{milestone.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-normal text-gray-500">
                      Due {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                    </span>
                    
                    {isEditable ? (
                      <Select 
                        value={milestone.status} 
                        onValueChange={async (v) => {
                          try {
                            const { error } = await supabase.from('milestones').update({ status: v }).eq('id', milestone.id)
                            if (error) throw error
                            toast.success('Milestone status updated')
                            queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
                          } catch (err: any) {
                            toast.error(err.message || 'Update failed')
                          }
                        }}
                      >
                        <SelectTrigger className={`h-7 w-32 border-none font-bold text-[10px] uppercase tracking-widest ${statusColors[milestone.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`font-normal border-none ${statusColors[milestone.status]}`}>
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                    )}

                    {isEditable && (
                      <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteMilestone(milestone.id, milestone.title)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 border-t border-gray-50 text-gray-600 bg-gray-50/50">
                <MilestoneTasks milestoneId={milestone.id} projectId={projectId} isEditable={isEditable} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

function MilestoneTasks({ milestoneId, projectId, isEditable }: { milestoneId: string, projectId: string, isEditable: boolean }) {
  const { data: tasks, isLoading } = useTasks(milestoneId)

  if (isLoading) return <Skeleton className="h-10 w-full mt-2" />
  
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm py-2">No tasks in this milestone.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Milestone Tasks</h4>
      </div>
      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <span className="text-sm text-gray-900 font-medium">{task.title}</span>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-gray-100">
              {task.status.replace('-', ' ')}
            </Badge>
          </div>
        ))}
      </div>
      {isEditable && (
        <div className="pt-2">
           <InlineAddTask 
             projectId={projectId} 
             milestoneId={milestoneId} 
             showStatusSelect={true}
           />
        </div>
      )}
    </div>
  )
}

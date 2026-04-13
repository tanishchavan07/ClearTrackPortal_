'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag, 
  ListTodo, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Edit2,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMilestones } from '@/lib/hooks/useMilestones'
import { useProjectTasks, useUpdateTask, useDeleteTask } from '@/lib/hooks/useTasks'
import { format } from 'date-fns'
import { Milestone, Task } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { AddMilestoneModal } from './AddMilestoneModal'
import { EditMilestoneModal } from './EditMilestoneModal'

export function OverviewTab({ projectId, isEditable, role }: { projectId: string, isEditable: boolean, role?: string }) {
  const { data: milestones, isLoading: mLoading } = useMilestones(projectId)
  const { data: tasks, isLoading: tLoading } = useProjectTasks(projectId)
  const queryClient = useQueryClient()

  if (mLoading || tLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>
    )
  }

  const stats = {
    totalMilestones: milestones?.length || 0,
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter(t => t.status === 'done').length || 0,
    inProgressTasks: tasks?.filter(t => t.status === 'in-progress').length || 0,
  }

  return (
    <div className="space-y-12">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Milestones', value: stats.totalMilestones, icon: Flag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Tasks', value: stats.totalTasks, icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Completed Tasks', value: stats.completedTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', value: stats.inProgressTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none bg-gray-50/50 rounded-3xl shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Milestones Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Milestones</h2>
          {isEditable && <AddMilestoneModal projectId={projectId} />}
        </div>

        <div className="space-y-4">
          {milestones?.map((milestone) => (
            <MilestoneCard 
              key={milestone.id} 
              milestone={milestone} 
              tasks={tasks?.filter(t => t.milestone_id === milestone.id) || []}
              isEditable={isEditable}
              projectId={projectId}
            />
          ))}
          {(!milestones || milestones.length === 0) && (
            <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No milestones created yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone, tasks, isEditable, projectId }: { milestone: Milestone, tasks: Task[], isEditable: boolean, projectId: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will delete all tasks in this milestone.')) return
    const { error } = await supabase.from('milestones').delete().eq('id', milestone.id)
    if (!error) {
      toast.success('Milestone deleted')
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  }

  const statusColors: any = {
    'todo': 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-blue-600 text-white shadow-lg shadow-blue-100',
    'done': 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
  }

  return (
    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-white shadow-2xl shadow-gray-100 rounded-[32px] border-2 border-blue-50' : 'bg-white rounded-2xl border border-gray-100 hover:border-gray-200'}`}>
      <div 
        className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl border border-gray-100 bg-gray-50/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
             <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{milestone.title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Due {format(new Date(milestone.due_date), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <Badge className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none ${statusColors[milestone.status]}`}>
            {milestone.status.replace('-', ' ')}
          </Badge>
          
          {isEditable && (
            <div className="flex items-center gap-1 border-l pl-4 border-gray-100">
               <EditMilestoneModal milestone={milestone} projectId={projectId} />
               <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={handleDelete}>
                 <Trash2 className="h-4 w-4" />
               </Button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-8 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-gray-50/50 rounded-3xl p-2 space-y-1">
             {tasks.map(task => (
               <TaskRow key={task.id} task={task} isEditable={isEditable} projectId={projectId} />
             ))}
             {tasks.length === 0 && (
               <p className="text-center py-8 text-xs font-bold text-gray-400 uppercase tracking-widest">No tasks assigned to this milestone.</p>
             )}
          </div>

          {isEditable && (
            <div className="mt-6 px-2">
               <InlineAddTask milestoneId={milestone.id} projectId={projectId} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, isEditable, projectId }: { task: Task, isEditable: boolean, projectId: string }) {
  const { mutate: updateTask } = useUpdateTask(projectId)
  const { mutate: deleteTask } = useDeleteTask(projectId)

  const statusIcons: any = {
    'todo': <Circle className="h-4 w-4 text-slate-300" />,
    'in-progress': <Clock className="h-4 w-4 text-blue-500" />,
    'review': <AlertCircle className="h-4 w-4 text-amber-500" />,
    'done': <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  }


  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors group">
      <div className="flex items-center gap-4">
        {statusIcons[task.status]}
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">{task.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isEditable ? (
          <Select 
            value={task.status} 
            onValueChange={(v: any) => updateTask({ id: task.id, updates: { status: v } })}
          >
            <SelectTrigger className="h-8 w-32 rounded-xl text-[10px] font-black uppercase tracking-widest border-none bg-gray-50 hover:bg-gray-100 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100">
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-none bg-gray-50 text-gray-400">
            {task.status.replace('-', ' ')}
          </Badge>
        )}

        {isEditable && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => confirm('Delete task?') && deleteTask(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function InlineAddTask({ milestoneId, projectId }: { milestoneId: string, projectId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSave = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').insert({
        milestone_id: milestoneId,
        title: title.trim(),
        status: 'todo',
        description: ''
      })
      if (error) throw error
      toast.success('Task added')
      setTitle('')
      setIsAdding(false)
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', milestoneId] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <Button 
        variant="ghost" 
        className="w-full justify-center h-10 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-3 w-3 mr-2" />
        Add Task
      </Button>
    )
  }

  return (
    <div className="p-4 bg-white rounded-[24px] border-2 border-blue-100 shadow-xl shadow-blue-50/50 space-y-4 animate-in zoom-in-95 duration-200">
       <div className="space-y-4">
          <Input 
            autoFocus
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded-xl border-gray-100 font-bold focus:border-blue-400 bg-gray-50/30"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
           <div className="flex gap-2 justify-end">
                 <Button onClick={handleSave} disabled={loading || !title.trim()} className="bg-blue-600 hover:bg-blue-700 h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                   Save
                 </Button>
                 <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-10 rounded-xl text-gray-400 hover:text-rose-500 font-black uppercase tracking-widest text-[10px]">
                   Cancel
                 </Button>
           </div>
        </div>
    </div>
  )
}

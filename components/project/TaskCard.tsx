'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { Edit2, Loader2, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InternalCommentBox } from '@/components/admin/InternalCommentBox'
import { useUpdateTask, useDeleteTask } from '@/lib/hooks/useTasks'
import { toast } from 'sonner'

interface TaskCardProps {
  task: Task
  milestoneTitle?: string
  role?: string
  projectId: string
}

export function TaskCard({ task, milestoneTitle, role, projectId }: TaskCardProps) {
  const isEditable = role === 'admin' || role === 'team'
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [hours, setHours] = useState(task.estimated_hours || 0)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { mutateAsync: updateTask } = useUpdateTask(projectId)
  const { mutateAsync: deleteTask } = useDeleteTask(projectId)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await updateTask({
        id: task.id,
        updates: {
          title,
          description,
          status,
          priority: priority as any,
          estimated_hours: Number(hours)
        }
      })
      toast.success('Task updated')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this task?')) return
    
    setIsDeleting(true)
    try {
      await deleteTask(task.id)
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const priorityColors = {
    low: 'text-gray-500 bg-gray-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-rose-600 bg-rose-50'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-grab active:cursor-grabbing group select-none relative space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
               <h4 className="font-bold text-gray-900 text-sm leading-tight pr-8">{task.title}</h4>
               {milestoneTitle && (
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                    {milestoneTitle}
                 </p>
               )}
            </div>
            
            {isEditable && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                <DialogTrigger className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8 hover:bg-blue-50 hover:text-blue-600' })}>
                  <Edit2 className="h-4 w-4" />
                </DialogTrigger>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
          
          {task.description && (
            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-4">
             <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${priorityColors[task.priority || 'medium']}`}>
                {task.priority || 'medium'}
             </div>
             {task.estimated_hours && (
               <div className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {task.estimated_hours}h
               </div>
             )}
          </div>
        </div>

        <DialogContent className="sm:max-w-[700px] flex flex-col gap-0 p-0 overflow-hidden bg-white rounded-[32px] border-none shadow-2xl">
          <div className="p-8 bg-gray-50/50 border-b border-gray-100">
             <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Management</p>
                </div>
                <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">Modify Task</DialogTitle>
             </DialogHeader>
          </div>

          <div className="flex gap-0 h-[60vh]">
            <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 border-gray-100 shadow-xl">
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Priority Level</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 border-gray-100 shadow-xl">
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50/30 text-lg" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Est. Hours</Label>
                    <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-12 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50/30" />
                 </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detailed Description</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="min-h-[150px] rounded-2xl border-2 border-gray-100 font-medium bg-gray-50/30 text-gray-600 leading-relaxed resize-none"
                  placeholder="What are the specifics of this task?"
                />
              </div>
            </div>
            
            {isEditable && (
              <div className="w-[300px] hidden lg:block border-l-2 border-gray-100 bg-gray-50/30 p-8 overfow-y-auto">
                <InternalCommentBox taskId={task.id} />
              </div>
            )}
          </div>

          <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading} className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Task Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, ListTodo } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Milestone } from '@/types'

interface AddTaskModalProps {
  projectId: string
}

export function AddTaskModal({ projectId }: AddTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingMilestones, setFetchingMilestones] = useState(true)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [milestoneId, setMilestoneId] = useState('')
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'review' | 'done'>('todo')
  
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      const fetchMilestones = async () => {
        const { data, error } = await supabase
          .from('milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true })
          
        if (error) {
          toast.error('Failed to load milestones')
        } else if (data) {
          setMilestones(data)
          if (data.length > 0) setMilestoneId(data[0].id)
        }
        setFetchingMilestones(false)
      }
      fetchMilestones()
    }
  }, [open, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicit check for milestoneId
    if (!milestoneId || milestoneId === '' || milestoneId === 'none') {
      toast.error('Please select a milestone first. If none exist, create one in the Roadmap tab.')
      return
    }

    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const { error } = await supabase.from('tasks').insert({
        milestone_id: milestoneId,
        title: title.trim(),
        description,
        status,
        assigned_to: userData.user.id // Default to creator
      })

      if (error) throw error

      const { error: activityError } = await supabase.from('activity_feed').insert({
        project_id: projectId,
        user_id: userData.user.id,
        action: 'task_added',
        message: `Added task: ${title}`
      })
      
      if (activityError) {
        console.error('Failed to log modal task activity:', activityError)
      }

      toast.success('Task added successfully')
      setOpen(false)
      setTitle('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}>
        <Plus className="h-4 w-4" />
        Add Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Assign a new task to one of the project milestones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={milestoneId} onValueChange={(val) => val && setMilestoneId(val)} required>
                <SelectTrigger id="milestone">
                  <SelectValue placeholder={fetchingMilestones ? "Loading..." : "Select milestone"} />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                  {milestones.length === 0 && !fetchingMilestones && (
                    <SelectItem value="none" disabled>No milestones found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="e.g. Export final assets"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Details about this task..."
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingMilestones || milestones.length === 0} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

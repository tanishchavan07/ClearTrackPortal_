'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Milestone } from '@/types'

interface InlineAddTaskProps {
  projectId: string
  milestoneId?: string
  milestones?: Milestone[]
  defaultStatus?: 'todo' | 'in-progress' | 'review' | 'done'
  showStatusSelect?: boolean
  onSuccess?: () => void
}

export function InlineAddTask({ 
  projectId, 
  milestoneId: initialMilestoneId, 
  milestones: initialMilestones,
  defaultStatus = 'todo',
  showStatusSelect = false,
  onSuccess 
}: InlineAddTaskProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hours, setHours] = useState<number>(0)
  const [status, setStatus] = useState(defaultStatus)
  const [milestoneId, setMilestoneId] = useState(initialMilestoneId || '')
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones || [])
  const [loading, setLoading] = useState(false)
  const [fetchingMilestones, setFetchingMilestones] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (initialMilestones) {
      setMilestones(initialMilestones)
      if (!milestoneId && initialMilestones.length > 0) {
        setMilestoneId(initialMilestones[0].id)
      }
    }
  }, [initialMilestones])

  useEffect(() => {
    if (isAdding && !initialMilestoneId && !initialMilestones) {
      const fetchMilestones = async () => {
        setFetchingMilestones(true)
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
  }, [isAdding, initialMilestoneId, initialMilestones, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicit UUID check
    if (!milestoneId || milestoneId === '' || milestoneId === 'none') {
      toast.error('Please select a milestone first')
      return
    }

    if (!title.trim()) {
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const { error: taskError } = await supabase.from('tasks').insert({
        milestone_id: milestoneId,
        title: title.trim(),
        description: description.trim(),
        status
      })

      if (taskError) throw taskError

      // Log activity
      await supabase.from('activity_feed').insert({
        project_id: projectId,
        user_id: userData.user.id,
        action: 'task_added',
        message: `Added task: ${title}`
      })

      toast.success('Task added')
      setTitle('')
      setDescription('')
      setHours(0)
      setIsAdding(false)
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['tasks', milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] })
      
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full justify-start text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 h-10 border-2 border-dashed border-gray-100 rounded-xl mt-2"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-3 w-3 mr-2" />
        Add Task
      </Button>
    )
  }

  return (
    <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-lg shadow-blue-50 mt-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialMilestoneId && (
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Milestone</Label>
            <Select value={milestoneId} onValueChange={(val) => val && setMilestoneId(val)} required>
              <SelectTrigger className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50/50 border-gray-100">
                <SelectValue placeholder={fetchingMilestones ? "Loading..." : "Milestone"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {milestones.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
                {milestones.length === 0 && !fetchingMilestones && (
                  <SelectItem value="none" disabled>No milestones found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Task Title</Label>
           <Input
            autoFocus
            placeholder="e.g. Design system audit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 text-sm font-bold border-gray-100 focus:border-blue-400 bg-gray-50/50 rounded-xl"
            disabled={loading || (milestones.length === 0 && !initialMilestoneId && !fetchingMilestones)}
           />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estimated Hours</Label>
          <Input 
            type="number" 
            value={hours} 
            onChange={(e) => setHours(Number(e.target.value))} 
            className="h-9 text-sm font-bold border-gray-100 bg-gray-50/50 rounded-xl w-32"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</Label>
          <Textarea 
            placeholder="Briefly describe the task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs font-medium border-gray-100 focus:border-blue-400 bg-gray-50/50 rounded-xl min-h-[80px] resize-none"
          />
        </div>
        
        {showStatusSelect && (
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50/50 border-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button 
            type="submit" 
            size="sm" 
            disabled={loading || !title.trim() || (milestones.length === 0 && !initialMilestoneId && !fetchingMilestones)} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Create Task
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(false)}
            className="h-10 px-4 rounded-xl text-gray-400 hover:text-rose-500 font-black uppercase tracking-widest text-[10px]"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, Calendar, Loader2 } from 'lucide-react'
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
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface AddMilestoneModalProps {
  projectId: string
}

export function AddMilestoneModal({ projectId }: AddMilestoneModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const { error } = await supabase.from('milestones').insert({
        project_id: projectId,
        title,
        due_date: dueDate,
        status: 'todo'
      })

      if (error) throw error

      await supabase.from('activity_feed').insert({
        project_id: projectId,
        user_id: userData.user.id,
        action: 'milestone_created',
        message: `created milestone: ${title}`
      })

      toast.success('Milestone added successfully')
      setOpen(false)
      setTitle('')
      setDueDate('')
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to add milestone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}>
        <Plus className="h-4 w-4" />
        Add Milestone
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Create a new major phase or deadline for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Milestone Title</Label>
              <Input
                id="title"
                placeholder="e.g. Design Handover"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="dueDate"
                  type="date"
                  className="pl-9"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

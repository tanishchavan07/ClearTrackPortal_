'use client'

import { useState } from 'react'
import { Plus, Calendar, Loader2, Edit2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Milestone } from '@/types'

interface EditMilestoneModalProps {
  milestone: Milestone
  projectId: string
}

export function EditMilestoneModal({ milestone, projectId }: EditMilestoneModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(milestone.title)
  const [dueDate, setDueDate] = useState(milestone.due_date)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return

    setLoading(true)
    try {
      const { error } = await supabase.from('milestones').update({
        title,
        due_date: dueDate
      }).eq('id', milestone.id)

      if (error) throw error

      toast.success('Milestone updated')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to update milestone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={(e) => { e.stopPropagation(); }}>
            <Edit2 className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] bg-white border-none rounded-[32px] shadow-2xl p-8">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Edit Milestone</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Update phase title or deadline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mb-8">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Title</Label>
              <Input
                id="edit-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="edit-dueDate"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-gray-100 pl-12 font-bold bg-gray-50/30"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

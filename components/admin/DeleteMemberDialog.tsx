'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any
  onSuccess: () => void
}

export function DeleteMemberDialog({ open, onOpenChange, member, onSuccess }: DeleteMemberDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!member) return

    setLoading(true)

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team member')
      }

      toast.success(`Team member ${member.name || member.email} deleted successfully`)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border-none rounded-[32px] shadow-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Delete Team Member?</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">
            Are you sure you want to delete <span className="text-red-500">{member?.name || member?.email}</span>? This will permanently remove their access and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="h-12 px-8 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
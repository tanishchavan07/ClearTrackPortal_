'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { Project } from '@/types'
import { useRouter } from 'next/navigation'

interface EditProjectModalProps {
  project: Project
  onSuccess?: () => void
}

export function EditProjectModal({ project, onSuccess }: EditProjectModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    setOpen(false)
    if (onSuccess) onSuccess()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="h-11 px-8 font-black uppercase text-[10px] tracking-widest border-2 border-gray-900 text-gray-900 rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-xl shadow-gray-100">
            Edit Project
          </Button>
        }
      />
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-none rounded-[32px] shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <ProjectForm 
            initialData={project as any} 
            isEditing={true} 
            onSuccess={handleSuccess} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

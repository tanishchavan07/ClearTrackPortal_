'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Project } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { generateProjectPDF } from '@/lib/utils/generatePDF'

interface ExportPDFButtonProps {
  project: Project
}

export function ExportPDFButton({ project }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      // Fetch required data for PDF
      const [milestonesRes, activityRes] = await Promise.all([
        supabase.from('milestones').select('*').eq('project_id', project.id).order('due_date', { ascending: true }),
        supabase.from('activity_feed').select('*, user:users!user_id(name)').eq('project_id', project.id).order('created_at', { ascending: false }).limit(20)
      ])

      const blob = await generateProjectPDF(
        project,
        milestonesRes.data || [],
        activityRes.data || []
      )

      // Auto-trigger download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      disabled={loading}
      className="bg-white"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Download Report
    </Button>
  )
}

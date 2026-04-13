'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  History, 
  Layout, 
  Loader2, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { MilestoneAccordion } from '@/components/project/MilestoneAccordion'
import { TaskBoard } from '@/components/project/TaskBoard'
import { ActivityFeed } from '@/components/project/ActivityFeed'
import { DocumentsLibrary } from '@/components/project/DocumentsLibrary'
import { FeedbackForm } from '@/components/project/FeedbackForm'
import { ExportPDFButton } from '@/components/shared/ExportPDFButton'
import { OverviewTab } from '@/components/project/OverviewTab'
import { EditProjectModal } from '@/components/project/EditProjectModal'

function DeleteProjectDialog({ project }: { project: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      toast.success('Project deleted successfully')
      router.push('/admin')
    } catch (error: any) {
      toast.error('Failed to delete project. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            variant="outline" 
            className="h-11 px-6 font-black uppercase text-[10px] tracking-widest border-2 border-rose-200 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] bg-white border-none rounded-[32px] shadow-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Delete Project?</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">
            Are you sure you want to delete <span className="text-rose-500">{project.name}</span>? This will permanently delete all milestones, tasks, files and activity. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 mt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            disabled={loading}
            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleDelete} 
            disabled={loading} 
            className="h-12 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { data: user, isLoading: userLoading } = useUser()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProjectData = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        milestones (
          *,
          tasks (*)
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      toast.error('Project not found')
      router.push('/')
    } else {
      setProject(data)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProjectData().finally(() => setLoading(false))
    }
  }, [projectId, router])

  if (loading || userLoading) {
    return (
      <div className="p-10 space-y-10 max-w-7xl mx-auto bg-white min-h-screen">
        <Skeleton className="h-[250px] w-full rounded-[40px]" />
        <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    )
  }

  if (!project) return null

  const isInternal = user?.role === 'admin' || user?.role === 'team'

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <div className="p-8 lg:p-12 max-w-7xl mx-auto border-b-2 border-gray-100 bg-white mb-12">
        <button
          onClick={() => router.push(isInternal ? '/admin' : '/')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Badge className={`uppercase font-black px-4 py-2 text-[10px] tracking-widest border-none ${
                    project.status === 'active' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 
                    project.status === 'completed' ? 'bg-emerald-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                  {project.status.replace('-', ' ')}
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                  <div className={`h-2 w-2 rounded-full ${
                    project.health === 'green' ? 'bg-emerald-500' : 
                    project.health === 'yellow' ? 'bg-amber-500' : 
                    'bg-rose-500'
                  } animate-pulse`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Health</span>
                </div>
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-gray-900 leading-none">
                {project.name}
              </h1>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Started on {format(new Date(project.created_at), 'MMMM d, yyyy')}
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" /> Current Progress
                </span>
                <span className="text-3xl font-black text-gray-900 leading-none">{project.progress}%</span>
              </div>
              <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1 border border-gray-100">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    project.health === 'green' ? 'bg-emerald-500' : 
                    project.health === 'yellow' ? 'bg-amber-500' : 
                    'bg-rose-500'
                  }`} 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 shrink-0">
             {user?.role === 'admin' && (
               <DeleteProjectDialog 
                 project={project} 
               />
             )}
             {isInternal && (
               <EditProjectModal 
                 project={project} 
                 onSuccess={fetchProjectData} 
               />
             )}
             <ExportPDFButton project={project} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-50/50 border-2 border-gray-100 p-2 h-auto flex flex-wrap lg:flex-nowrap rounded-[32px] gap-2 mb-12 shadow-sm">
            {[ 
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'activity', label: 'Activity', icon: History },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 min-w-[140px] py-4 rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all hover:bg-white border-none"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <OverviewTab projectId={projectId} isEditable={isInternal} role={user?.role} />
          </TabsContent>

          <TabsContent value="documents" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DocumentsLibrary projectId={projectId} isEditable={isInternal} />
          </TabsContent>

          <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ActivityFeed projectId={projectId} userRole={user?.role || 'client'} />
          </TabsContent>

          <TabsContent value="feedback" className="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center mb-12 space-y-4">
                <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-[30%] mx-auto flex items-center justify-center rotate-6 hover:rotate-0 transition-transform shadow-xl shadow-blue-50/50">
                   <MessageSquare className="h-10 w-10" />
                </div>
                <h2 className="text-4xl font-black text-gray-900">Reach the team.</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Your feedback synchronizes directly with our Slack & Internal Feeds</p>
             </div>
             <FeedbackForm projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

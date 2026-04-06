'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, CheckCircle, BarChart3, AlertCircle, ArrowRight, TrendingUp, Clock, Rocket } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id, title, due_date, status
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load projects')
      } else {
        setProjects(data || [])
      }
      setLoading(false)
    }

    if (user?.id) fetchProjects()
  }, [user?.id])

  if (userLoading || loading) {
    return (
      <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto bg-white min-h-screen">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    )
  }

  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
    : 0

  const radialData = [{ value: avgProgress, fill: '#2563eb' }]

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto bg-white min-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-8 border-b border-gray-100 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm shadow-blue-50">
          Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-400">
           <span>{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
           <span className="h-1 w-1 bg-gray-200 rounded-full" />
           <span className="text-gray-500">Your Project Ecosystem Overview</span>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="py-32 bg-gray-50/30 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-100 mb-8">
            <Rocket className="h-10 w-10 text-blue-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2"> Your project is being set up. 🚀</h3>
          <p className="text-sm font-medium text-gray-500 max-w-xs"> You'll see it here very soon! Our team is currently preparing your digital workspace.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Tasks', value: projects.length, icon: LayoutGrid, color: 'blue' },
              { label: 'Active Status', value: projects.filter(p => p.status === 'active').length, icon: TrendingUp, color: 'emerald' },
              { label: 'Completed Phases', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'indigo' },
              { label: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, icon: Clock, color: 'rose' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white border-2 border-gray-100 shadow-sm rounded-3xl p-2 hover:shadow-xl hover:shadow-gray-100 transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 drop-shadow-sm`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">{stat.label}</p>
                    <h4 className="text-2xl font-black text-gray-900 leading-tight">{stat.value}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Progress Chart */}
            <Card className="bg-white border-2 border-gray-100 shadow-sm rounded-[32px] p-6 lg:p-8">
              <CardHeader className="text-center p-0 mb-6">
                <CardTitle className="text-lg font-black uppercase tracking-widest text-gray-900">Aggregate Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[260px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={radialData} startAngle={90} endAngle={450}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} angleAxisId={0} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <span className="text-5xl font-black text-blue-600 drop-shadow-sm">{avgProgress}%</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Average Completion</span>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 w-full">
                  <p className="text-xs text-center text-gray-500 font-bold leading-relaxed px-4"> Overall performance across your active project portfolio. </p>
                </div>
              </CardContent>
            </Card>

            {/* Grid of Projects */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <LayoutGrid className="h-6 w-6 text-blue-600" />
                Active Initiatives
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {projects.map((project) => {
                  const nextMilestone = project.milestones
                    ?.filter((m: any) => m.status !== 'done')
                    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="group">
                      <Card className="h-full bg-white border-2 border-gray-100 shadow-sm rounded-3xl hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50/50 transition-all overflow-hidden flex flex-col">
                        <div className="p-6 pb-2">
                           <div className="flex justify-between items-start mb-4">
                              <Badge className={`capitalize font-black text-[9px] tracking-widest border-none px-3 py-1 ${
                                  project.status === 'active' ? 'bg-blue-600 text-white' : 
                                  project.status === 'completed' ? 'bg-emerald-600 text-white' :
                                  'bg-slate-600 text-white'
                                } shadow-sm`}>
                                {project.status}
                              </Badge>
                              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                                <div className={`h-2.5 w-2.5 rounded-full ${
                                      project.health === 'green' ? 'bg-emerald-500 shadow-emerald-200 shadow-[0_0_8px]' : 
                                      project.health === 'yellow' ? 'bg-amber-500' : 
                                      'bg-rose-500 shadow-rose-200 shadow-[0_0_8px]'
                                    }`} />
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{project.health}</span>
                              </div>
                           </div>
                           <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                             {project.name}
                           </h3>
                        </div>

                        <CardContent className="p-6 pt-2 h-full flex flex-col justify-between gap-6">
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>Progress Coverage</span>
                                <span className="text-blue-600 text-sm">{project.progress}%</span>
                             </div>
                             <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner p-0.5">
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

                          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                               <Clock className="h-3 w-3" /> Next Milestone
                             </p>
                             {nextMilestone ? (
                               <div className="flex justify-between items-center">
                                 <span className="text-sm font-bold text-gray-900 truncate mr-2">{nextMilestone.title}</span>
                                 <span className="text-[10px] font-bold text-gray-500 truncate whitespace-nowrap">
                                   {format(new Date(nextMilestone.due_date), 'MMM d')}
                                 </span>
                               </div>
                             ) : (
                               <span className="text-sm font-bold text-gray-400 italic">No upcoming milestones</span>
                             )}
                          </div>

                          <div className="pt-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center justify-end gap-2 group-hover:gap-3 transition-all">
                               View Dashboard <ArrowRight className="h-4 w-4" />
                             </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

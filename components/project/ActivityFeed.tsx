'use client'

import { formatDistanceToNow } from 'date-fns'
import { useActivityFeed } from '@/lib/hooks/useActivityFeed'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface ActivityFeedProps {
  projectId: string
  userRole: 'client' | 'team' | 'admin'
}

export function ActivityFeed({ projectId, userRole }: ActivityFeedProps) {
  const { data: activities, isLoading } = useActivityFeed(projectId)

  if (isLoading) {
    return (
      <div className="space-y-6 p-10 bg-white">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-6 animate-pulse">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-3 flex-1 mt-1">
               <Skeleton className="h-4 w-1/4 rounded-full" />
               <Skeleton className="h-4 w-3/4 rounded-lg" />
             </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white p-16 text-center">
        <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
           <LayoutGrid className="h-5 w-5 text-gray-300" />
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          No Activity Stream Yet
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white max-h-[700px] overflow-y-auto custom-scrollbar">
      <div className="divide-y divide-gray-50">
        {activities.map((item) => (
          <div key={item.id} className="p-6 md:p-8 hover:bg-gray-50/50 transition-colors flex items-start gap-5">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-gray-50">
              <AvatarFallback className={`font-black text-xs border-none ${
                  item.user?.role === 'admin' ? 'bg-indigo-600 text-white' : 
                  item.user?.role === 'team' ? 'bg-blue-600 text-white' : 
                  'bg-white text-gray-900 border-2 border-gray-100 shadow-inner'
                }`}>
                {item.user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900 tracking-tight">{item.user?.name}</span>
                  <Badge variant="outline" className={`px-2 py-0 h-4 border-none text-[8px] font-black uppercase tracking-widest ${
                      item.user?.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 
                      item.user?.role === 'team' ? 'bg-blue-50 text-blue-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {item.user?.role}
                  </Badge>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium mt-1">
                <span className="text-gray-400 italic">Action:</span> {item.action?.replace('_', ' ')} • {item.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LayoutGrid(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

import { Clock } from 'lucide-react'

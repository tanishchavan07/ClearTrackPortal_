'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { InviteClientModal } from '@/components/admin/InviteClientModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      // Typically we'd fetch clients and count their projects
      // We can do a join: select('*, projects(count)')
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, created_at,
          projects ( id )
        `)
        .eq('role', 'client')
        
      if (!error && data) {
        setClients(data)
      }
      setLoading(false)
    }
    
    fetchClients()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage client access and overall projects</p>
        </div>
        <InviteClientModal />
      </div>

      <div className="bg-white border md:rounded-xl shadow-sm border-gray-200 -mx-4 sm:mx-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search clients..." className="pl-9" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Client Name</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Projects</th>
                <th className="px-6 py-3 border-b border-gray-200 text-right uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-8 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No clients found. Send an invite to get started.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100">
                          {client.name?.substring(0, 2).toUpperCase() || 'NA'}
                        </AvatarFallback>
                      </Avatar>
                      {client.name || 'Pending Onboarding'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {client.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 px-2.5 py-0.5 border border-gray-200 rounded-full font-medium text-xs">
                        {client.projects?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Search, Mail, FolderKanban } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { InviteClientModal } from '@/components/admin/InviteClientModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/lib/hooks/useUser'

export default function ClientsPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // All hooks must be at the top - BEFORE any early returns
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        
        // Fetch all clients from users table
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('role', 'client')
        
        if (error) {
          console.error('Error fetching clients:', error.message)
          return
        }

        // Fetch project counts for each client
        const clientsWithCounts = await Promise.all((data || []).map(async (client) => {
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .or(`client_id.eq.${client.id},client_email.eq.${client.email}`)
          
          return { ...client, projectCount: count || 0 }
        }))
        
        setClients(clientsWithCounts)
      } catch (err) {
        console.error('Unexpected error in fetchClients:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // NOW do early returns - AFTER all hooks
  // Early return for non-admin users (admin layout also protects this)
  if (!userLoading && user?.role !== 'admin') {
    return null
  }

  if (userLoading) {
    return (
      <div className="p-10 space-y-10 max-w-7xl mx-auto bg-white min-h-screen">
        <Skeleton className="h-[250px] w-full rounded-[40px]" />
        <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients List</h1>
          <p className="text-gray-500 mt-1">Manage client access and overall projects</p>
        </div>
        <InviteClientModal />
      </div>

      <div className="bg-white border md:rounded-xl shadow-sm border-gray-200 -mx-4 sm:mx-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Client Name</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs whitespace-nowrap">Projects</th>
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
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                       <Mail className="h-8 w-8 text-gray-300" />
                      <p>No clients found. {searchTerm ? 'Try a different search.' : 'Send an invite to get started.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-bold text-sm">
                            {client.name?.substring(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{client.name || 'New Client'}</span>
                          <span className="text-xs text-gray-400 font-normal">ID: {client.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">{client.email}</span>
                        {!client.name && (
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Awaiting Onboarding</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <span className="h-1 w-1 rounded-full bg-green-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          <span className="h-1 w-1 rounded-full bg-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group/projects">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-gray-700 group-hover/projects:bg-blue-50 group-hover/projects:text-blue-700 group-hover/projects:border-blue-100 transition-colors">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-gray-900">{client.projectCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold">
                        Manage
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

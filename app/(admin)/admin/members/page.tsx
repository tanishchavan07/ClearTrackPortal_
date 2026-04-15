'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/lib/hooks/useUser'
import { toast } from 'sonner'
import { AddMemberModal } from '@/components/admin/AddMemberModal'
import { EditMemberModal } from '@/components/admin/EditMemberModal'
import { DeleteMemberDialog } from '@/components/admin/DeleteMemberDialog'

export default function MembersPage() {
  // All hooks MUST be at the top - BEFORE any early returns
  const { data: user, isLoading: userLoading } = useUser()
  const [members, setMembers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  // All useEffect hooks must be at the top level
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)

        const response = await fetch('/api/members')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch members')
        }

        const data = await response.json()
        
        // Ensure members is an array
        if (!Array.isArray(data.members)) {
          console.warn('Invalid members data format:', data)
          setMembers([])
          return
        }
        
        setMembers(data.members)
      } catch (err: any) {
        console.error('Error fetching members:', err)
        toast.error(err.message || 'Failed to load members')
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchMembers()
    }
  }, [user])

  // NOW do early returns - AFTER all hooks
  // Early return if not admin (the admin layout also protects this, but this ensures clean UI)
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

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSuccess = () => {
    setAddModalOpen(false)
    toast.success('Member added successfully')
    // Re-fetch members instead of full page reload
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) throw new Error('Failed to fetch members')
        const data = await response.json()
        setMembers(Array.isArray(data.members) ? data.members : [])
      } catch (err: any) {
        console.error('Error refreshing members:', err)
        toast.error('Failed to refresh members list')
      }
    }
    fetchMembers()
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setSelectedMember(null)
    toast.success('Member updated successfully')
    // Re-fetch members instead of full page reload
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) throw new Error('Failed to fetch members')
        const data = await response.json()
        setMembers(Array.isArray(data.members) ? data.members : [])
      } catch (err: any) {
        console.error('Error refreshing members:', err)
        toast.error('Failed to refresh members list')
      }
    }
    fetchMembers()
  }

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false)
    setSelectedMember(null)
    toast.success('Member deleted successfully')
    // Re-fetch members instead of full page reload
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) throw new Error('Failed to fetch members')
        const data = await response.json()
        setMembers(Array.isArray(data.members) ? data.members : [])
      } catch (err: any) {
        console.error('Error refreshing members:', err)
        toast.error('Failed to refresh members list')
      }
    }
    fetchMembers()
  }

  if (userLoading) {
    return <div>Loading...</div>
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Members</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage team members</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="bg-white border md:rounded-xl shadow-sm border-gray-200 -mx-4 sm:mx-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
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
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-3 border-b border-gray-200 uppercase tracking-wider text-xs">Joined</th>
                <th className="px-6 py-3 border-b border-gray-200 text-right uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No members match your search.' : 'No team members found'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {member.name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member)
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleAddSuccess}
      />

      <EditMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={selectedMember}
        onSuccess={handleEditSuccess}
      />

      <DeleteMemberDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        member={selectedMember}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
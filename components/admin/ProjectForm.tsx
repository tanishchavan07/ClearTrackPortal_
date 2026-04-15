'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Project } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'

interface ProjectFormProps {
  initialData?: Project & { client_email?: string; client_name?: string }
  isEditing?: boolean
  onSuccess?: () => void
}

export function ProjectForm({ initialData, isEditing, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'planning',
    health: initialData?.health || 'green',
    progress: initialData?.progress || 0,
    clientEmail: initialData?.client_email || '',
    clientName: initialData?.client_name || ''
  })

  const sendInvite = async (email: string, name: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name, role: 'client' }
      }
    })
    return { error }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      let clientId = null

      if (isEditing && initialData?.id) {
        // For editing, check existing client
        if (formData.clientEmail) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', formData.clientEmail.toLowerCase().trim())
            .maybeSingle()
          if (existingUser) clientId = existingUser.id
        }

        const projectPayload = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          health: formData.health,
          progress: formData.progress,
          client_id: clientId || initialData?.client_id || null,
          client_email: formData.clientEmail.toLowerCase().trim()
        }

        const { error: updateError } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', initialData.id)
        
        if (updateError) throw updateError
        toast.success('Project updated successfully')
        if (onSuccess) {
          onSuccess()
          return
        }
      } else {
        // ===== NEW PROJECT FLOW =====

        // Step 1: Send magic link invite to client
        const { error: inviteError } = await sendInvite(formData.clientEmail, formData.clientName)
        if (inviteError) throw inviteError

        // Step 2: Check if client already exists in users table
        const email = formData.clientEmail.toLowerCase().trim()
        const { data: existingClient } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          // Step 3: Create client in users table immediately
          const { data: newClient, error: clientError } = await supabase
            .from('users')
            .insert({
              email: email,
              name: formData.clientName || null,
              role: 'client'
            })
            .select('id')
            .single()

          if (clientError) {
            console.error('Could not create client record:', clientError.message)
            // Not fatal — project will still be created, client will be linked on first login
          } else {
            clientId = newClient.id
            console.log('Client created in users table with ID:', clientId)
          }
        }

        // Step 4: Create the project linked to the client
        const projectPayload = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          health: formData.health,
          progress: formData.progress,
          client_id: clientId || null,
          client_email: email
        }

        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert(projectPayload)
          .select()
          .single()
          
        if (projectError) throw projectError

        // Step 5: Log activity
        await supabase.from('activity_feed').insert({
          project_id: newProject.id,
          user_id: userData.user.id,
          action: 'project_created',
          message: `created the project and invited ${formData.clientEmail}`
        })

        toast.success('Project created & client added!')
      }

      router.push('/admin')
    } catch (error: any) {
      toast.error(error.message || 'Error saving project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl bg-white border-gray-200 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                required 
                placeholder="e.g. Website Redesign 2024"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                rows={3}
                placeholder="Briefly describe the project goals..."
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Client Invitation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input 
                  id="clientEmail" 
                  type="email"
                  required 
                  placeholder="client@email.com"
                  value={formData.clientEmail} 
                  onChange={e => setFormData({...formData, clientEmail: e.target.value})} 
                  disabled={isEditing} // Usually don't allow changing email on an active project for auth safety
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name (Optional)</Label>
                <Input 
                  id="clientName" 
                  placeholder="e.g. John Doe"
                  value={formData.clientName} 
                  onChange={e => setFormData({...formData, clientName: e.target.value})} 
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">
              Invitations use Magic Links. Your client will be added to the portal automatically when they log in.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({...formData, status: (v ?? 'planning') as any})}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="health">Health</Label>
              <Select 
                value={formData.health} 
                onValueChange={v => setFormData({...formData, health: (v ?? 'green') as any})}
              >
                <SelectTrigger id="health">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green (On Track)</SelectItem>
                  <SelectItem value="yellow">Yellow (At Risk)</SelectItem>
                  <SelectItem value="red">Red (Off Track)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm">
              <Label htmlFor="progress">Current Progress</Label>
              <span className="font-bold text-blue-600">{formData.progress}%</span>
            </div>
            <input 
              id="progress" 
              type="range" 
              min="0" max="100" 
              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              value={formData.progress}
              onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 bg-gray-50 border-t border-gray-100 rounded-b-xl py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 font-semibold shadow-sm">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Save Changes' : 'Launch Project'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

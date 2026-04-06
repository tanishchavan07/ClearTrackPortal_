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
import { Loader2, Mail, Send } from 'lucide-react'

interface ProjectFormProps {
  initialData?: Project & { client_email?: string; client_name?: string }
  isEditing?: boolean
  onSuccess?: () => void
}

export function ProjectForm({ initialData, isEditing, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'planning',
    health: initialData?.health || 'green',
    progress: initialData?.progress || 0,
    clientEmail: initialData?.client_email || '',
    clientName: initialData?.client_name || ''
  })

  const sendInvite = async (email: string, name: string, projectId?: string) => {
    // Exact STEP 1 logic from user request
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name: name,
          role: 'client'
        }
      }
    })
    return { error }
  }

  const handleResendInvite = async () => {
    if (!formData.clientEmail) return
    setResending(true)
    try {
      const { error } = await sendInvite(formData.clientEmail, formData.clientName, initialData?.id)
      if (error) throw error
      toast.success(`Invite resent to ${formData.clientEmail}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invite')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const projectPayload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        health: formData.health,
        progress: formData.progress,
        client_id: initialData?.client_id || null // Maintain existing client_id if editing, otherwise null as requested
      }

      let projectId = initialData?.id

      if (isEditing && projectId) {
        // Update project
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', projectId)
        
        if (updateError) throw updateError
        toast.success('Project updated successfully')
        if (onSuccess) {
          onSuccess()
          return
        }
      } else {
        // EXACT STEP 1: Send magic link invite FIRST
        const { error: inviteError } = await sendInvite(formData.clientEmail, formData.clientName)
        if (inviteError) throw inviteError

        // EXACT STEP 2: Create project WITHOUT client_id for now
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            description: formData.description,
            status: formData.status,
            health: formData.health,
            progress: formData.progress,
            client_id: null // Explicitly null as per request
          })
          .select()
          .single()
          
        if (projectError) throw projectError
        projectId = newProject.id

        // Activity log
        await supabase.from('activity_feed').insert({
          project_id: projectId,
          user_id: userData.user.id,
          action: 'project_created',
          message: `created the project and invited ${formData.clientEmail}`
        })

        toast.success(`Project created! Invite sent to ${formData.clientEmail}`)
      }

      router.push('/admin') // STEP 4: Redirect to /admin
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
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleResendInvite}
                disabled={resending}
                className="text-blue-600 border-blue-100 hover:bg-blue-50"
              >
                {resending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                Resend Project Invite
              </Button>
            )}
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

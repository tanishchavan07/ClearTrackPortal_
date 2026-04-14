'use client'

import { useState } from 'react'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useUser } from '@/lib/hooks/useUser'

export function FeedbackForm({ projectId }: { projectId: string }) {
  const { data: user, isLoading: userLoading } = useUser()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject) {
      toast.error('Please select a subject')
      return
    }

    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long')
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      // SECURITY: Double-check role from DB before inserting
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'client') {
        throw new Error('Only clients can submit feedback.')
      }

      const { error } = await supabase.from('feedback').insert({
        project_id: projectId,
        user_id: userData.user.id,
        subject: subject,
        message: message
      })

      if (error) throw error

      toast.success('Feedback sent to your project team!')
      setSubject('')
      setMessage('')
    } catch (error: any) {
      toast.error(error.message || 'Error submitting feedback')
    } finally {
      setLoading(false)
    }
  }

  // Hide the form entirely for admin/team
  if (userLoading) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  if (user?.role !== 'client') return null

  return (
    <Card className="bg-white rounded-3xl shadow-lg shadow-gray-100 border-none">
      <CardHeader className="pt-8 px-8">
        <h3 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Submit Feedback</h3>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-8 py-6">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-gray-400">Subject</Label>
            <Select value={subject} onValueChange={(val) => setSubject(val ?? '')}>
              <SelectTrigger id="subject" className="w-full h-12 rounded-xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="General Feedback" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="General Feedback">General Feedback</SelectItem>
                <SelectItem value="Request Change">Request Change</SelectItem>
                <SelectItem value="Report Issue">Report Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-gray-400">Message</Label>
            <Textarea
              id="message"
              required
              placeholder="Tell us what's on your mind... (min 10 chars)"
              className="min-h-[160px] resize-none rounded-xl border-gray-100 bg-gray-50/50 p-4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="px-8 pb-8 pt-0 flex justify-end">
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Feedback
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

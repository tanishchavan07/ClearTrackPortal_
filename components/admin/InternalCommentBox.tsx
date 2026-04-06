'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Comment } from '@/types'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function InternalCommentBox({ taskId }: { taskId: string }) {
  const { data: user } = useUser()
  const [comments, setComments] = useState<(Comment & { user: { name: string } })[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Verify role manually, although it shouldn't render for clients
  const isInternal = user?.role === 'team' || user?.role === 'admin'

  const fetchComments = async () => {
    if (!isInternal) return
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users!user_id(name)')
      .eq('task_id', taskId)
      .eq('is_internal', true)
      .order('created_at', { ascending: true })
      
    if (!error && data) {
      setComments(data as any)
    }
    setFetching(false)
  }

  useEffect(() => {
    fetchComments()
  }, [taskId, isInternal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return
    
    setLoading(true)
    try {
      const { error } = await supabase.from('comments').insert({
        task_id: taskId,
        user_id: user.id,
        message,
        is_internal: true
      })
      
      if (error) throw error
      setMessage('')
      await fetchComments()
    } catch (error: any) {
      toast.error(error.message || 'Error posting comment')
    } finally {
      setLoading(false)
    }
  }

  if (!isInternal) return null

  return (
    <div className="flex flex-col h-full bg-yellow-50/50 rounded-xl border border-yellow-200">
      <div className="p-4 border-b border-yellow-200 bg-yellow-100/50 rounded-t-xl">
        <h4 className="text-sm font-semibold text-yellow-800">Internal Team Comments</h4>
        <p className="text-xs text-yellow-700">These notes are hidden from the client.</p>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto max-h-60 space-y-4">
        {fetching ? (
          <Skeleton className="w-full h-8" />
        ) : comments.length === 0 ? (
          <p className="text-xs text-center text-yellow-600/70 italic">No internal comments yet.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-6 w-6 border border-yellow-300">
                <AvatarFallback className="bg-yellow-200 text-yellow-800 text-[10px]">
                  {comment.user?.name?.substring(0, 2).toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white p-2.5 rounded-lg border border-yellow-200 shadow-sm text-sm text-gray-800">
                  {comment.message}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] font-medium text-yellow-800">{comment.user?.name || 'Unknown'}</span>
                  <span className="text-[10px] text-yellow-600/70">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-yellow-200 bg-white/50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea 
            placeholder="Type an internal note..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[40px] h-[40px] py-2 text-sm resize-none focus-visible:ring-yellow-400 border-yellow-200 bg-white"
          />
          <Button type="submit" disabled={loading || !message.trim()} size="icon" className="h-10 w-10 shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, ArrowRight, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update user name in public.users
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id)

      if (error) throw error

      toast.success('CheckTrack welcomes you!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Welcome to ClearTrack! 👋</h1>
            <p className="text-gray-400 mt-2 font-medium">Before we show your project, what should we call you?</p>
          </div>
        </div>

        <Card className="bg-white border-2 border-gray-100 shadow-sm rounded-3xl p-2 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-gray-400">Your Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    id="name" 
                    required 
                    placeholder="Enter your name" 
                    className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-lg font-medium transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-6">
              <Button 
                type="submit" 
                disabled={loading || !name.trim()} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl text-lg font-black transition-all shadow-lg shadow-blue-200"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Take me to my project <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

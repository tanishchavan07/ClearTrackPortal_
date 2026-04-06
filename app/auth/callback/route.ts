import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // If query fails, something is wrong
          return NextResponse.redirect(`${origin}/auth/login?error=ProfileNotFound`)
        }

        const role = profile?.role || 'client'
        const hasName = !!profile?.name && profile.name !== user.email

        // REDIRECT LOGIC
        if (role === 'client') {
          if (!hasName) {
            return NextResponse.redirect(`${origin}/onboarding`)
          }
          return NextResponse.redirect(`${origin}/`)
        }

        if (role === 'team' || role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }
      }
    }
  }

  // default failure path
  return NextResponse.redirect(`${origin}/auth/login?error=AuthenticationFailed`)
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Query public.users table to get role and name
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', user.id)
          .single()

        // AUTO-CREATE USER IF MISSING IN PUBLIC.USERS
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Auth Callback: User not in public.users table. Auto-creating client...')
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .upsert({ 
              id: user.id, 
              email: user.email, 
              role: 'client',
              name: user.email // Temporary name is email to trigger onboarding
            })
            .select('role, name')
            .single()

          if (insertError) {
            console.error('Auth Callback: Fatal error auto-creating user:', insertError)
            return NextResponse.redirect(`${origin}/auth/login?error=ProfileCreationStoreFailed`)
          }
          profile = newProfile
          profileError = null

          // NEW AUTO-LINK PROJECTS LOGIC: 
          // Link projects where client_email matches but client_id is null
          if (user.email) {
            console.log('Auth Callback: Linking orphaned projects for email:', user.email)
            const { error: linkError } = await supabase
              .from('projects')
              .update({ client_id: user.id })
              .eq('client_email', user.email.toLowerCase())
              .is('client_id', null)
            
            if (linkError) {
              console.error('Auth Callback: Warning - project auto-link failed:', linkError)
            }
          }
        }

        if (profileError) {
          console.error('Auth Callback: Profile Query Error', profileError)
          return NextResponse.redirect(`${origin}/auth/login?error=ProfileNotFound`)
        }

        const role = profile?.role || 'client'
        const normalizedRole = role.toLowerCase()
        const name = profile?.name
        const email = user.email

        console.log('Auth Callback Decision - User ID:', user.id, 'Role:', normalizedRole, 'Name:', name)

        // REDIRECT LOGIC
        if (normalizedRole === 'client') {
          const nameIsEmpty = !name || name.trim() === ''
          const nameIsEmail = name === email
          
          if (nameIsEmpty || nameIsEmail) {
            console.log('Auth Callback: Client needs onboarding. Redirecting to /onboarding')
            return NextResponse.redirect(`${origin}/onboarding`)
          } else {
            console.log('Auth Callback: Client verified. Redirecting to /')
            return NextResponse.redirect(`${origin}/`)
          }
        }

        if (normalizedRole === 'team' || normalizedRole === 'admin') {
          console.log('Auth Callback: Redirecting Staff to /admin')
          return NextResponse.redirect(`${origin}/admin`)
        }

        // Fallback
        console.log('Auth Callback: Defaulting unknown role', role, 'to client area')
        return NextResponse.redirect(`${origin}/`)
      }
    }
  }

  // default failure path
  console.log('Auth Callback: Token exchange failed or no code. Redirecting to login.')
  return NextResponse.redirect(`${origin}/auth/login?error=AuthenticationFailed`)
}

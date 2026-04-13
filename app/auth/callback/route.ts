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

        // AUTO-CREATE USER IF MISSING IN PUBLIC.USERS (by auth ID)
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Auth Callback: User not found by auth ID. Checking by email...')
          
          // Check if user was pre-created by the invite-client API (different ID but same email)
          const { data: emailUser } = await supabase
            .from('users')
            .select('id, role, name')
            .eq('email', user.email?.toLowerCase())
            .maybeSingle()

          if (emailUser) {
            // Pre-created user found! Update its ID to match the auth user ID
            console.log('Auth Callback: Found pre-created client by email. Updating ID from', emailUser.id, 'to', user.id)
            
            // Update projects that reference the old ID
            await supabase
              .from('projects')
              .update({ client_id: user.id })
              .eq('client_id', emailUser.id)

            // Delete old row and create new one with correct auth ID
            await supabase.from('users').delete().eq('id', emailUser.id)
            
            const { data: updatedProfile, error: upsertError } = await supabase
              .from('users')
              .upsert({ 
                id: user.id, 
                email: user.email, 
                role: emailUser.role || 'client',
                name: emailUser.name
              })
              .select('role, name')
              .single()

            if (upsertError) {
              console.error('Auth Callback: Error updating pre-created user:', upsertError)
            } else {
              profile = updatedProfile
              profileError = null
            }
          } else {
            // No pre-created user — create fresh
            console.log('Auth Callback: No pre-created user found. Creating new client...')
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .upsert({ 
                id: user.id, 
                email: user.email, 
                role: 'client',
                name: user.email
              })
              .select('role, name')
              .single()

            if (insertError) {
              console.error('Auth Callback: Fatal error auto-creating user:', insertError)
              return NextResponse.redirect(`${origin}/auth/login?error=ProfileCreationStoreFailed`)
            }
            profile = newProfile
            profileError = null
          }

          // Auto-link any orphaned projects by email
          if (user.email) {
            console.log('Auth Callback: Linking orphaned projects for email:', user.email)
            await supabase
              .from('projects')
              .update({ client_id: user.id })
              .eq('client_email', user.email.toLowerCase())
              .is('client_id', null)
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

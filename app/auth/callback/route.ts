import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('=== AUTH CALLBACK TRIGGERED ===')
  console.log('Auth Callback URL:', request.url)
  const url = new URL(request.url)
  const { searchParams } = url
  const origin = url.origin
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const errorCode = searchParams.get('error_code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth Callback Params:', {
    code: !!code,
    token_hash: !!token_hash,
    type,
    errorCode,
    next,
  })

  const supabase = await createClient()

  if (errorCode === 'otp_expired') {
    console.log('Auth Callback: error_code=otp_expired detected from query params. Redirecting to /session-expired')
    return NextResponse.redirect(`${origin}/session-expired`)
  }

  let authAttempted = false
  let authError: unknown = null

  if (code) {
    console.log('Auth Callback: attempting exchangeCodeForSession')
    authAttempted = true
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth Callback: exchangeCodeForSession error:', error)
      authError = error
    }
  }

  if ((!code || authError) && token_hash && type) {
    console.log('Auth Callback: attempting verifyOtp')
    authAttempted = true
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      console.error('Auth Callback: verifyOtp error:', error)
      authError = error
    } else {
      authError = null
    }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  console.log('Auth Callback Session Status:', {
    authAttempted,
    authError: authError ? true : false,
    sessionExists: !!sessionData?.session,
    sessionError: sessionError?.message ?? null,
    userId: user?.id ?? null,
    getUserError: getUserError?.message ?? null,
  })

  if (user) {
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('Auth Callback: User ID not found in users table. Checking by email...')

      const { data: emailUser } = await supabase
        .from('users')
        .select('id, role, name')
        .eq('email', user.email?.toLowerCase())
        .maybeSingle()

      if (emailUser) {
        console.log('Auth Callback: Found pre-created client by email. Updating ID from', emailUser.id, 'to', user.id)

        await supabase
          .from('projects')
          .update({ client_id: user.id })
          .eq('client_id', emailUser.id)

        await supabase.from('users').delete().eq('id', emailUser.id)

        const { data: updatedProfile, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            role: emailUser.role || 'client',
            name: emailUser.name || user.email,
          })
          .select('role, name')
          .single()

        if (upsertError) {
          console.error('Auth Callback: Upsert error:', upsertError)
        } else {
          profile = updatedProfile
          profileError = null
        }
      } else {
        console.log('Auth Callback: No pre-created user found. Creating new client profile...')
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            role: 'client',
            name: user.email,
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
      console.error('Auth Callback: Profile query error:', profileError)
      return NextResponse.redirect(`${origin}/auth/login?error=ProfileNotFound`)
    }

    const role = profile?.role || 'client'
    const normalizedRole = role.toLowerCase()
    const name = profile?.name
    const email = user.email

    console.log('Auth Callback Decision - User ID:', user.id, 'Role:', normalizedRole, 'Name:', name)

    if (normalizedRole === 'client') {
      const nameIsEmpty = !name || name.trim() === ''
      const nameIsEmail = name === email

      if (nameIsEmpty || nameIsEmail) {
        console.log('Auth Callback: Client onboarding required. Redirecting to /onboarding')
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      console.log('Auth Callback: Client authenticated. Redirecting to /client-dashboard')
      return NextResponse.redirect(`${origin}/client-dashboard`)
    }

    if (normalizedRole === 'team' || normalizedRole === 'admin') {
      console.log('Auth Callback: Staff authenticated. Redirecting to /admin')
      return NextResponse.redirect(`${origin}/admin`)
    }

    console.log('Auth Callback: Unknown role', role, 'redirecting to /client-dashboard')
    return NextResponse.redirect(`${origin}/client-dashboard`)
  }

  if (authError) {
    console.log('Auth Callback: Auth processing failed but link did not explicitly expire. Redirecting to login.')
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  console.log('Auth Callback: No active session or auth params found. Redirecting to login.')
  return NextResponse.redirect(`${origin}/auth/login`)
}

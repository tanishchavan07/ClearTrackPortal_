import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Send magic link OTP invite
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        data: { name, role: 'client' }
      }
    })

    if (otpError) {
      console.error('Invite OTP Error:', otpError)
      return NextResponse.json({ error: otpError.message }, { status: 500 })
    }

    // 2. Check if client already exists in public.users by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existingUser) {
      // Client already exists, just return their ID
      return NextResponse.json({ 
        success: true, 
        clientId: existingUser.id,
        isNew: false,
        message: 'Client already exists' 
      })
    }

    // 3. Client doesn't exist yet — create a placeholder in public.users
    //    We use email as a temporary unique identifier
    //    The ID will be a generated UUID; when the client actually logs in
    //    via the magic link, the auth callback will handle re-linking
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,  // null name = "Pending" status in the UI
        role: 'client'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('User insert error:', insertError)
      // Not fatal — the invite was still sent, user will be auto-created on login
      return NextResponse.json({ 
        success: true, 
        clientId: null,
        isNew: false,
        message: 'Invite sent but could not pre-create client record'
      })
    }

    console.log('API: Created new client in users table:', newUser.id, email)

    return NextResponse.json({ 
      success: true, 
      clientId: newUser.id,
      isNew: true,
      message: 'Client created and invite sent'
    })

  } catch (error: any) {
    console.error('Invite API error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can view members
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all team members
    // Note: created_at may be null for existing rows, so we handle that in the response
    const { data: members, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('role', 'team')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Ensure we always return an array
    const sanitizedMembers = (members || []).map((member: any) => ({
      id: member.id,
      name: member.name || 'Unnamed',
      email: member.email,
      role: member.role,
      created_at: member.created_at || new Date().toISOString()
    }))

    return NextResponse.json({ members: sanitizedMembers })
  } catch (error: any) {
    console.error('Members API error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Debug: Log environment variable status (without exposing secrets)
    const urlExists = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const keyExists = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('[Members API] Environment check - URL exists:', urlExists, 'Key exists:', keyExists)
    
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('[Members API] Admin client created successfully')
    } catch (clientError: any) {
      console.error('[Members API] Failed to create admin client:', clientError.message)
      return NextResponse.json({
        error: 'Server configuration error: Unable to initialize admin client',
        details: clientError.message,
        debug: {
          urlExists,
          keyExists,
          errorMessage: clientError.message
        }
      }, { status: 500 })
    }

    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()
    if (getUserError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can add members
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Use Admin API to create user without sending email
    // This avoids rate limiting issues and email verification requirements
    let authData
    let createUserError
    
    try {
      const response = await adminClient.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true, // Mark email as confirmed - no verification needed
        user_metadata: {
          name,
          role: 'team'
        }
      })
      authData = response.data
      createUserError = response.error
    } catch (error: any) {
      console.error('Admin createUser error:', error)
      return NextResponse.json({
        error: 'Failed to create user in authentication system',
        details: error.message
      }, { status: 500 })
    }

    if (createUserError) {
      console.error('Admin create user error:', createUserError)
      
      // Handle specific error conditions
      if (createUserError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      
      return NextResponse.json({
        error: createUserError.message || 'Failed to create user',
        code: createUserError.code
      }, { status: 400 })
    }

    // Verify user was created
    if (!authData?.user?.id) {
      return NextResponse.json({ error: 'User creation failed - no user ID returned' }, { status: 500 })
    }

    // Insert user into users table with role and metadata
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email: email.toLowerCase().trim(),
        role: 'team'
      })

    if (insertError) {
      console.error('Insert user error:', insertError)
      
      // If insert fails, we should ideally clean up the auth user
      // but for now we'll just return the error
      return NextResponse.json({ error: 'Failed to save user to database', code: insertError.code }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Team member created successfully',
      member: {
        id: authData.user.id,
        name,
        email: email.toLowerCase().trim(),
        role: 'team'
      }
    })
  } catch (error: any) {
    console.error('Members POST API error:', error)
    return NextResponse.json({
      error: error.message || 'Internal error',
      code: error.code
    }, { status: 500 })
  }
}
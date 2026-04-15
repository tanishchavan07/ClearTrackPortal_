import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: putAuthError } = await supabase.auth.getUser()
    if (putAuthError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can update members
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email } = await request.json()
    const memberId = resolvedParams.id

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Update member in database
    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        email: email.toLowerCase().trim()
      })
      .eq('id', memberId)
      .eq('role', 'team') // Ensure we only update team members
      .select('id, name, email, role, created_at')
      .single()

    if (error) {
      console.error('Update member error:', error)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: data
    })
  } catch (error: any) {
    console.error('Update member API error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: deleteAuthError } = await supabase.auth.getUser()
    if (deleteAuthError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can delete members
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const memberId = resolvedParams.id

    // Delete member from database
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId)
      .eq('role', 'team') // Ensure we only delete team members

    if (error) {
      console.error('Delete member error:', error)
      return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete member API error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
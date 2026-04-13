import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware already blocks non-clients from reaching '/'.
  // This is a defence-in-depth server-side guard that matches the same
  // two-step role-lookup pattern used in middleware and the admin layout,
  // ensuring there is never a race condition between async lookups.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Resolve role — identical two-step lookup used across middleware and layouts.
  let role: string | undefined

  const { data: profileById } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileById?.role) {
    role = profileById.role.toLowerCase()
  } else if (user.email) {
    const { data: profileByEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
    if (profileByEmail?.role) role = profileByEmail.role.toLowerCase()
  }

  // Staff who somehow reach the client area get pushed to /admin.
  if (role === 'admin' || role === 'team') {
    redirect('/admin')
  }

  // Unknown or missing roles are not allowed — send to login.
  if (role !== 'client') {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">ClearTrack Portal</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}

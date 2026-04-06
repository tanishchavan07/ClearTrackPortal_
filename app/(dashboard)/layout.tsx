import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // PROBLEM 4 FIX - Dashboard layout blocking client
  if (!user) {
    console.log('Dashboard Layout: No user, redirecting back to /auth/login')
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role?.toLowerCase()

  console.log('Dashboard Layout role check:', role)

  if (role === 'team' || role === 'admin') {
    console.log('Dashboard Layout: Staff in client area. Redirecting to /admin')
    redirect('/admin')
  }

  if (role !== 'client') {
    console.log('Dashboard Layout: Unknown or non-client role:', role, '- redirecting to login')
    redirect('/auth/login')
  }

  console.log('Dashboard Layout: Role is client. Rendering children.')
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

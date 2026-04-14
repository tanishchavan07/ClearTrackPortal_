import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ClientNav } from '@/components/layout/ClientNav'

export default async function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Resolve role for chrome selection — same two-step pattern used in all layouts.
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

  const isStaff = role === 'admin' || role === 'team'

  if (isStaff) {
    // Admin/team: full sidebar + topbar chrome
    return (
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Client (or unknown role that passed middleware): minimal chrome with ClientNav.
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ClientNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

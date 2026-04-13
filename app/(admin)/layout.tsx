import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ErrorRedirectGuard } from '@/components/auth/ErrorRedirectGuard'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defence-in-depth: middleware is the first line, but this server-side
  // check ensures no client can ever render the admin UI even if middleware
  // has a gap (e.g. direct navigation, browser back-button after role change).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Look up the role by UID first, then fall back to email for pre-created rows.
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

  // Only admin and team may access this layout.
  if (role !== 'admin' && role !== 'team') {
    // Return a hard 404 for unauthorized client access instead of a redirect
    if (role === 'client') {
      notFound()
    } else {
      redirect('/auth/login')
    }
  }

  return (
    <>
      {/* Intercepts expired / invalid magic-link hash errors client-side
          before any dashboard content is painted. Renders null. */}
      <ErrorRedirectGuard />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

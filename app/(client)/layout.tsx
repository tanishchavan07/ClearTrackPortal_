import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClientNav } from '@/components/layout/ClientNav'
import { ErrorRedirectGuard } from '@/components/auth/ErrorRedirectGuard'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Two-step role lookup: by UID first, then by email for pre-created rows.
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

  // Admin or team trying to access the client area → hard 404.
  // Do NOT redirect them to /admin; that leaks information about route existence.
  if (role === 'admin' || role === 'team') {
    notFound()
  }

  // Unknown/missing role → send to login.
  if (role !== 'client') {
    redirect('/auth/login')
  }

  return (
    <>
      {/* Intercepts expired / invalid magic-link hash errors client-side
          before any dashboard content is painted. Renders null. */}
      <ErrorRedirectGuard />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <ClientNav />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  )
}

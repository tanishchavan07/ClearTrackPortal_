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

  // Role lookup by UID only — no email fallback.
  // The auth callback always syncs the auth UID into public.users before
  // redirecting here, so an email-based lookup is never needed. Falling back
  // to email is also a security risk: a stale pre-created row could return
  // the wrong role for a completely different authenticated user.
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role?.toLowerCase()

  // Only admin and team may access this layout.
  // client → hard 404 (not a redirect — avoids leaking admin route existence).
  // Unknown / missing role → back to login.
  if (role === 'client') {
    notFound()
  }
  if (role !== 'admin' && role !== 'team') {
    redirect('/auth/login')
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

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

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

  // Role lookup by UID only — no email fallback.
  // The auth callback always syncs the auth UID into public.users before
  // redirecting here, so an email-based lookup is never needed.
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role?.toLowerCase()

  // Admin / team reaching the client dashboard → hard 404.
  // Previously this was redirect('/admin'), but a silent cross-role redirect
  // contributed to the role-flip UX bug and leaks route information.
  // A 404 is consistent with how (admin)/layout.tsx handles client users.
  if (role === 'admin' || role === 'team') {
    notFound()
  }

  // Unknown or missing role → login.
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

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Hexagon, LogOut } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

// Client-only navigation — NO admin links, NO admin routes.
// This component is intentionally separate from the AdminSidebar.
export function ClientNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useUser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderOpen },
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-0 flex items-center justify-between sticky top-0 z-10 h-16">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Hexagon className="h-5 w-5 text-blue-600 fill-blue-600" />
        <span className="text-lg font-bold tracking-tight text-gray-900">ClearTrack</span>
      </div>

      {/* Navigation links */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign-out */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20 hidden md:block" />
          </>
        ) : user ? (
          <>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900 leading-tight">{user.name}</span>
              <span className="text-xs text-gray-400 leading-tight">{user.email}</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {user.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </>
        ) : null}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  )
}

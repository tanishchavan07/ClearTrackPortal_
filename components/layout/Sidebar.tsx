'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, Hexagon } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useUser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const clientLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ]

  const adminLinks = [
    { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
  ]

  const userRole = user?.role?.toLowerCase()
  const navLinks = (userRole === 'admin' || userRole === 'team') ? adminLinks : clientLinks

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-gray-100 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-100">
        <Hexagon className="h-6 w-6 text-blue-600 fill-blue-600" />
        <span className="text-lg font-bold tracking-tight text-gray-900">ClearTrack</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        {isLoading ? (
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {user.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
              <span className="text-xs text-gray-500 truncate">{user.email}</span>
            </div>
          </div>
        ) : null}
        
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

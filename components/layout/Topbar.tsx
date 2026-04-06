'use client'

import { usePathname } from 'next/navigation'
import { SearchBar } from '@/components/shared/SearchBar'
import { Bell, Menu } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function Topbar() {
  const pathname = usePathname()
  const { data: user } = useUser()

  // Generate a page title based on the pathname
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname === '/admin') return 'Admin Dashboard'
    if (pathname?.startsWith('/projects/')) return 'Project Details'
    if (pathname?.startsWith('/admin/projects/new')) return 'Create Project'
    if (pathname?.startsWith('/admin/clients')) return 'Clients'
    return 'ClearTrack'
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-6 sm:justify-between px-4 sm:px-8">
        <div className="hidden flex-1 sm:block max-w-md mx-auto">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-500">
            <Bell className="h-5 w-5" />
            {/* Notification badge indicator */}
            <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </Button>
          
          <Avatar className="h-8 w-8 md:hidden">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

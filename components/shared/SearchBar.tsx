'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const [query, setQuery] = useState('')

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="search"
        placeholder="Search projects or activity..."
        className="pl-10 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}

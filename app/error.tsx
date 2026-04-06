'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center max-w-md text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-sm text-gray-500 mb-6 flex-1">
          {error.message || "An unexpected error occurred while processing your request."}
        </p>
        <Button onClick={() => reset()} className="w-full bg-blue-600 hover:bg-blue-700">
          Try again
        </Button>
      </div>
    </div>
  )
}

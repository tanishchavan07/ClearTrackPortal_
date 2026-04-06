import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center max-w-md text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
          <FileQuestion className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          We couldn't find the page you were looking for. The link might be broken, or the page may have been removed.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'default', className: 'w-full bg-blue-600 hover:bg-blue-700' })}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

import { AlertTriangle, Mail } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Link Expired – ClearTrack Portal',
  description: 'Your login link has expired or is invalid. Request a new one from your team.',
}

/**
 * /session-expired
 *
 * Shown when Supabase redirects with:
 *   #error=access_denied&error_code=otp_expired&error_description=...
 *
 * The ErrorRedirectGuard client component (mounted in protected layouts)
 * detects the hash fragment and navigates here via router.replace().
 * This page itself is a static Server Component — no auth required.
 */
export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-8">

        {/* Brand header — matches /auth/login */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <AlertTriangle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-2">
            ClearTrack Portal
          </h1>
        </div>

        <Card className="bg-white border-gray-200 shadow-sm border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center text-gray-900">
              Link Expired
            </CardTitle>
            <CardDescription className="text-center text-gray-500 text-sm leading-relaxed">
              Your login link has expired or is invalid.
              <br />
              Login links can only be used once and expire after a short time.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-2">
            {/* Visual divider with icon */}
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Return to the login page and we&apos;ll send you a fresh link
                to your inbox.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-4">
            {/* Plain text placeholder matching previous layout spacing */}
            <div className="w-full h-11 flex items-center justify-center text-lg font-bold text-red-600">
              Go Back
            </div>

            <p className="text-xs text-center text-gray-400">
              If you keep having trouble, contact your project administrator.
            </p>
          </CardFooter>
        </Card>

      </div>
    </div>
  )
}

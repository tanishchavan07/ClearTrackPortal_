import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClearTrack Portal',
  description: 'Client onboarding & project tracking web application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}

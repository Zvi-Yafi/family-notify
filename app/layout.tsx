import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FamilyNotify - פלטפורמה למשפחה',
  description: 'מערכת לשליחת הודעות ואירועים למשפחה הגדולה',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FamilyNotify',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}

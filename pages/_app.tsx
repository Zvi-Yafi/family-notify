import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FamilyNotify - פלטפורמה למשפחה</title>
        <meta name="description" content="מערכת לשליחת הודעות ואירועים למשפחה הגדולה" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FamilyNotify" />
      </Head>
      <ErrorBoundary>
        <div className={inter.className}>
          <Providers>
            <Component {...pageProps} />
            <Toaster />
            <Sonner position="top-center" richColors />
          </Providers>
        </div>
      </ErrorBoundary>
    </>
  )
}

import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import Script from 'next/script'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAuth } from '@/lib/hooks/use-auth'
import { GA_MEASUREMENT_ID, isGAEnabled, pageview, setUserId } from '@/lib/analytics'
import '@/src/i18n'

const inter = Inter({ subsets: ['latin'] })

function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!isGAEnabled()) return

    pageview(window.location.pathname + window.location.search)

    const handleRouteChange = (url: string) => {
      pageview(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  useEffect(() => {
    if (!isGAEnabled()) return
    setUserId(user?.id ?? null)
  }, [user?.id])

  return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {isGAEnabled() && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      <Head>
        <title>FamNotify – הודעות ועדכונים למשפחה</title>
        <meta name="description" content="רשימת תפוצה משפחתית לשליחת הודעות, עדכוני אירועים ותזכורות בוואצאפ, SMS ואימייל" />
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
            <AnalyticsProvider>
              <Component {...pageProps} />
            </AnalyticsProvider>
            <Toaster />
            <Sonner position="top-center" richColors />
          </Providers>
        </div>
      </ErrorBoundary>
    </>
  )
}

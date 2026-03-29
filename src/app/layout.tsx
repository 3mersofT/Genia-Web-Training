import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import GENIAProvider from '@/components/providers/GENIAProvider'
import PWAProvider from '@/components/providers/PWAProvider'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ErrorBoundary from '@/components/ErrorBoundary'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { BRAND } from '@/config/branding'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
  applicationName: BRAND.seo.applicationName,
  authors: [{ name: 'Hemerson KOFFI' }],
  generator: 'Next.js',
  keywords: [...BRAND.seo.keywords],
  referrer: 'origin-when-cross-origin',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: BRAND.colors.theme.light },
    { media: '(prefers-color-scheme: dark)', color: BRAND.colors.theme.dark }
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND.seo.applicationName
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: BRAND.seo.locale,
    url: BRAND.urls.production,
    title: BRAND.title,
    description: BRAND.description,
    siteName: BRAND.seo.applicationName,
    images: [
      {
        url: BRAND.assets.ogImage,
        width: 1200,
        height: 630,
        alt: BRAND.seo.applicationName
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.title,
    description: BRAND.description,
    images: ['/twitter-image.png']
  },
  icons: {
    icon: [
      { url: '/icons/16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'google-verification-code',
    other: {
      me: [`contact@${BRAND.email.domain}`]
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: BRAND.colors.theme.light
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        {/* Meta tags PWA supplémentaires */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Splash screens iOS */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash/splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <GENIAProvider>
              <PWAProvider>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </PWAProvider>
            </GENIAProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

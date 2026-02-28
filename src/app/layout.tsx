import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GENIAProvider from '@/components/providers/GENIAProvider'
import PWAProvider from '@/components/providers/PWAProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GENIA Training - Prompt Engineering Academy',
  description: 'Maîtrisez l\'art du Prompt Engineering avec notre formation interactive et notre assistant IA GENIA',
  applicationName: 'GENIA Training',
  authors: [{ name: 'Hemerson KOFFI' }],
  generator: 'Next.js',
  keywords: ['prompt engineering', 'IA', 'formation', 'GENIA', 'ChatGPT', 'Claude', 'Mistral'],
  referrer: 'origin-when-cross-origin',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' }
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GENIA Training'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://genia-training.com',
    title: 'GENIA Training - Prompt Engineering Academy',
    description: 'Maîtrisez l\'art du Prompt Engineering avec notre formation interactive',
    siteName: 'GENIA Training',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GENIA Training'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GENIA Training - Prompt Engineering Academy',
    description: 'Maîtrisez l\'art du Prompt Engineering avec notre formation interactive',
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
      me: ['contact@genia-training.com']
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3B82F6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
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
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <GENIAProvider>
            <PWAProvider>
              <ToastProvider>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </ToastProvider>
            </PWAProvider>
          </GENIAProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}

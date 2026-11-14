import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/inter'
import '@fontsource/hind-siliguri/400.css'
import '@fontsource/hind-siliguri/500.css'
import '@fontsource/hind-siliguri/600.css'
import '@fontsource/hind-siliguri/700.css'
import './globals.css'
import { DemoBanner } from '@/components/DemoBanner'
import { SiteHeader } from '@/components/SiteHeader'
import { getSession } from '@/lib/auth/session'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: { default: 'BiLuna — Your Personal Healthcare AI Companion', template: '%s · BiLuna' },
  description:
    'BiLuna is a Bangladesh-first healthcare AI companion prototype. Demo with fictional data. Not medical advice.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [{ lang, dict }, session] = await Promise.all([getDict(), getSession()])

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >
          {dict.nav.skip}
        </a>
        <DemoBanner text={dict.banner} />
        <SiteHeader dict={dict} lang={lang} session={session} />
        <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-line bg-white">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs leading-relaxed text-muted sm:px-6">
            {dict.welcome.prototype}
          </p>
        </footer>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/manrope'
import '@fontsource-variable/space-grotesk'
import '@fontsource/hind-siliguri/400.css'
import '@fontsource/hind-siliguri/500.css'
import '@fontsource/hind-siliguri/600.css'
import '@fontsource/hind-siliguri/700.css'
import './globals.css'
import { DemoBanner } from '@/components/DemoBanner'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: { default: 'BiLuna — Your Personal Healthcare AI Companion', template: '%s · BiLuna' },
  description:
    'BiLuna is a Bangladesh-first healthcare AI companion prototype. Demo with fictional data. Not medical advice.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' }

/** Shared by every page: language, fonts, background and the demo banner. Each area adds its own frame. */
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { lang, dict } = await getDict()

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
        >
          {dict.nav.skip}
        </a>
        <DemoBanner text={dict.banner} />
        {children}
      </body>
    </html>
  )
}

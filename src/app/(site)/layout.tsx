import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { getSession } from '@/lib/auth/session'
import { getDict } from '@/lib/i18n/server'

/** Public pages: top menu, page content, footer. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ lang, dict }, session] = await Promise.all([getDict(), getSession()])

  return (
    <>
      <SiteHeader dict={dict} lang={lang} session={session} />
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs leading-relaxed text-muted sm:px-6">
          <p>{dict.welcome.prototype}</p>
          <nav aria-label={dict.legal.privacy} className="flex gap-4 font-semibold">
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-ink">
              {dict.legal.privacy}
            </Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-ink">
              {dict.legal.terms}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}

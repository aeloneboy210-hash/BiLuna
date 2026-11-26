import { SiteHeader } from '@/components/SiteHeader'
import { getSession } from '@/lib/auth/session'
import { getDict } from '@/lib/i18n/server'

/** Public pages: top menu, page content, footer. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ dict }, session] = await Promise.all([getDict(), getSession()])

  return (
    <>
      <SiteHeader dict={dict} session={session} />
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs leading-relaxed text-muted sm:px-6">
          {dict.welcome.prototype}
        </p>
      </footer>
    </>
  )
}

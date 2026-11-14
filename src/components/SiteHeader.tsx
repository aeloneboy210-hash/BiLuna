import Link from 'next/link'
import { signOut } from '@/app/sign-in/actions'
import type { Session } from '@/lib/auth/session'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'
import { PORTALS } from '@/lib/portals'
import { LanguageSwitch } from './LanguageSwitch'
import { Logo } from './Logo'

const navLink = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-brand hover:bg-soft'

export function SiteHeader({
  dict,
  lang,
  session,
}: {
  dict: Dictionary
  lang: Lang
  session: Session | null
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Logo name={dict.brand.name} />
        <nav aria-label={dict.brand.name} className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Link href="/roadmap" className={navLink}>
            {dict.nav.roadmap}
          </Link>
          {session ? (
            <>
              <Link href={PORTALS[session.role].home} className={navLink}>
                {dict.nav.myPortal}
              </Link>
              <form action={signOut}>
                <button type="submit" className={navLink}>
                  {dict.nav.signOut}
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" className={navLink}>
              {dict.nav.signIn}
            </Link>
          )}
          <LanguageSwitch current={lang} label={dict.nav.language} />
        </nav>
      </div>
    </header>
  )
}

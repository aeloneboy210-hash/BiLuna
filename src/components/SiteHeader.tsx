import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'
import { LanguageSwitch } from './LanguageSwitch'
import { Logo } from './Logo'

const navLink = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-brand hover:bg-soft'

export function SiteHeader({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Logo name={dict.brand.name} />
        <nav aria-label={dict.brand.name} className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Link href="/roadmap" className={navLink}>
            {dict.nav.roadmap}
          </Link>
          <Link href="/sign-in" className={navLink}>
            {dict.nav.signIn}
          </Link>
          <LanguageSwitch current={lang} label={dict.nav.language} />
        </nav>
      </div>
    </header>
  )
}

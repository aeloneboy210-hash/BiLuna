import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Icon } from '@/components/ui/Icon'
import type { Session } from '@/lib/auth/session'
import { signOut } from '@/lib/auth/sign-out'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'
import { MODULES } from '@/lib/modules'
import { navFor, type NavKey } from '@/lib/ui/nav'
import { SidebarNav, type SidebarLink } from './SidebarNav'

function labelFor(key: NavKey, dict: Dictionary): string {
  if (key === 'dashboard') return dict.nav.dashboard
  if (key === 'roadmap') return dict.nav.roadmap
  return MODULES.find((m) => m.id === key)!.name.replace(/^BiLuna /, '')
}

/** The app frame from the dashboard design: sidebar on the left, a top bar, then the page. */
export function PortalFrame({
  session,
  dict,
  lang,
  children,
}: {
  session: Session
  dict: Dictionary
  lang: Lang
  children: ReactNode
}) {
  const links: SidebarLink[] = navFor(session.role).map((item) => ({
    href: item.href,
    icon: item.icon,
    label: labelFor(item.key, dict),
  }))
  const initial = session.displayName.trim().slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-1 gap-6 px-3 py-4 sm:px-5 lg:py-6">
      <aside className="glass sticky top-6 hidden h-[calc(100vh-5.5rem)] w-64 shrink-0 flex-col gap-6 overflow-y-auto rounded-3xl p-4 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-1 pt-1">
          <Image src="/brand/logo-small-v3.webp" alt="" width={96} height={90} className="brand-art h-12 w-auto" />
          <span className="flex flex-col">
            <span className="text-gradient font-display text-2xl leading-none font-bold">{dict.brand.name}</span>
            <span className="mt-1 text-[0.7rem] leading-tight text-body">{dict.brand.tagline}</span>
          </span>
        </Link>

        <SidebarNav links={links} label={dict.nav.menu} />

        <div className="mt-auto flex flex-col gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-semibold text-body hover:bg-soft/60 hover:text-aqua"
            >
              <Icon name="logout" className="h-5 w-5 text-cyan" />
              {dict.nav.signOut}
            </button>
          </form>
          <div className="flex items-center gap-3 rounded-2xl border border-cyan/25 bg-soft/40 p-3.5">
            <Icon name="shield" className="h-8 w-8 shrink-0 text-cyan" />
            <p className="text-xs leading-snug text-body">{dict.shell.dataSafe}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="flex flex-wrap items-center gap-3">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image src="/brand/logo-small-v3.webp" alt="" width={96} height={90} className="brand-art h-10 w-auto" />
            <span className="text-gradient font-display text-xl font-bold">{dict.brand.name}</span>
          </Link>

          <label className="glass hidden min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4 text-muted md:flex">
            <Icon name="search" className="h-5 w-5 text-cyan" />
            <span className="sr-only">{dict.shell.search}</span>
            <input
              type="search"
              disabled
              placeholder={dict.shell.search}
              className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted disabled:cursor-not-allowed"
            />
          </label>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch current={lang} label={dict.nav.language} />
            <span
              title={dict.shell.notifications}
              className="glass hidden h-11 w-11 items-center justify-center rounded-full text-cyan sm:flex"
            >
              <Icon name="bell" className="h-5 w-5" label={dict.shell.notifications} />
            </span>
            <div className="glass flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-brand to-cyan font-display font-bold text-on-brand"
              >
                {initial}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold">{session.displayName}</span>
                <span className="text-xs text-muted">{dict.shell.roles[session.role]}</span>
              </span>
            </div>
            <form action={signOut} className="lg:hidden">
              <button type="submit" className="min-h-11 rounded-full px-3 text-sm font-semibold text-aqua">
                {dict.nav.signOut}
              </button>
            </form>
          </div>
        </header>

        <div className="lg:hidden">
          <SidebarNav links={links} label={dict.nav.menu} compact />
        </div>

        <main id="content" className="flex min-w-0 flex-col gap-6">
          {children}
        </main>

        <p className="pb-2 text-xs text-muted">{dict.welcome.prototype}</p>
      </div>
    </div>
  )
}

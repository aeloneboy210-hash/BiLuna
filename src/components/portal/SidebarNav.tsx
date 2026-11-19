'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import type { IconName } from '@/lib/ui/icons'

export type SidebarLink = { href: string; icon: IconName; label: string }

/** The portal's menu. The page you are on is highlighted. `compact` is the scrolling row used on phones. */
export function SidebarNav({
  links,
  label,
  compact = false,
}: {
  links: SidebarLink[]
  label: string
  compact?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav aria-label={label}>
      <ul className={compact ? 'flex gap-2 overflow-x-auto pb-1' : 'flex flex-col gap-1'}>
        {links.map((link) => {
          const active = link.href === pathname
          return (
            <li key={link.href} className={compact ? 'shrink-0' : undefined}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-semibold transition-all ${
                  active
                    ? 'bg-brand text-on-brand'
                    : compact
                      ? 'glass text-body hover:text-ink'
                      : 'text-body hover:bg-soft hover:text-ink'
                }`}
              >
                <Icon name={link.icon} className={`h-5 w-5 shrink-0 ${active ? '' : 'text-cyan'}`} />
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

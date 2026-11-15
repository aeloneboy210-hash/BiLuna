import Link from 'next/link'
import type { IconName } from '@/lib/ui/icons'
import { Icon } from './ui/Icon'

/** A pill-shaped shortcut in a portal hero. The first one is filled, the rest are outlined. */
export function QuickAction({
  href,
  icon,
  label,
  primary = false,
}: {
  href: string
  icon: IconName
  label: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all ${
        primary
          ? 'bg-brand text-on-brand shadow-[0_0_28px_rgb(0_168_255/0.45)] hover:bg-cyan'
          : 'border border-cyan/40 bg-surface/60 text-aqua hover:border-cyan hover:shadow-[0_0_24px_rgb(0_168_255/0.3)]'
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </Link>
  )
}

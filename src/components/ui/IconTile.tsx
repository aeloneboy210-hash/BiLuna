import type { IconName } from '@/lib/ui/icons'
import { Icon } from './Icon'

const SIZES = {
  sm: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
  md: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6' },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 'h-8 w-8' },
} as const

/** A flat rounded square holding an icon, like the app icon on the brand board. */
export function IconTile({
  name,
  size = 'md',
  tone = 'brand',
}: {
  name: IconName
  size?: keyof typeof SIZES
  tone?: 'brand' | 'danger' | 'solid'
}) {
  const tones = {
    brand:
      'border-tint bg-tint text-brand',
    danger:
      'border-danger/30 bg-danger/10 text-danger',
    solid: 'border-on-brand/20 bg-on-brand/15 text-on-brand',
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center border ${SIZES[size].box} ${tones[tone]}`}
    >
      <Icon name={name} className={SIZES[size].icon} />
    </span>
  )
}

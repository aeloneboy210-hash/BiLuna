import type { IconName } from '@/lib/ui/icons'
import { Icon } from './Icon'

const SIZES = {
  sm: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
  md: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6' },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 'h-8 w-8' },
} as const

/** A glowing rounded square holding an icon, like the app icon on the brand board. */
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
      'border-cyan/35 bg-linear-to-br from-brand/25 to-cyan/5 text-aqua shadow-[0_0_22px_rgb(0_168_255/0.3),inset_0_1px_0_rgb(102_240_255/0.25)]',
    danger:
      'border-danger/40 bg-linear-to-br from-danger/25 to-danger/5 text-danger shadow-[0_0_22px_rgb(255_138_128/0.25)]',
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

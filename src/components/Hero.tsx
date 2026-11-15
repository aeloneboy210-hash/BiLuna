import Image from 'next/image'
import type { ReactNode } from 'react'
import type { IconName } from '@/lib/ui/icons'
import { IconTile } from './ui/IconTile'
import { SampleTag } from './ui/SampleTag'

/**
 * The large panel at the top of every portal: portal name, greeting, a short line,
 * optional quick actions, the floating BiLuna logo and the glowing horizon from the brand board.
 */
export function Hero({
  icon,
  eyebrow,
  title,
  subtitle,
  sampleLabel,
  actions,
}: {
  icon: IconName
  eyebrow: string
  title: string
  subtitle: string
  sampleLabel?: string
  actions?: ReactNode
}) {
  return (
    <section className="glass horizon motion-safe:animate-rise rounded-3xl px-6 pt-7 pb-14 sm:px-10 sm:pt-10 sm:pb-20">
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <IconTile name={icon} size="sm" />
            <p className="text-xs font-semibold tracking-[0.18em] text-aqua uppercase">{eyebrow}</p>
            {sampleLabel ? <SampleTag label={sampleLabel} /> : null}
          </div>
          <h1 className="text-3xl leading-tight font-bold sm:text-5xl">{title}</h1>
          <p className="max-w-xl text-base leading-relaxed text-body sm:text-lg">{subtitle}</p>
          {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        <Image
          src="/brand/logo-v2.webp"
          alt=""
          width={390}
          height={364}
          fetchPriority="high"
          className="brand-art motion-safe:animate-float hidden h-auto w-44 shrink-0 md:block lg:w-56"
        />
      </div>
    </section>
  )
}

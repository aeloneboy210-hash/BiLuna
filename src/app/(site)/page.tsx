import Image from 'next/image'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { IconTile } from '@/components/ui/IconTile'
import { getDict } from '@/lib/i18n/server'
import { MODULES } from '@/lib/modules'
import { ROLES } from '@/lib/portals'
import type { IconName } from '@/lib/ui/icons'
import { MODULE_ICONS, ROLE_ICONS } from '@/lib/ui/module-icons'

const FEATURES: { key: 'care' | 'insights' | 'science' | 'everyone'; icon: IconName }[] = [
  { key: 'care', icon: 'heart' },
  { key: 'insights', icon: 'brain' },
  { key: 'science', icon: 'dna' },
  { key: 'everyone', icon: 'users' },
]

export default async function WelcomePage() {
  const { dict } = await getDict()
  const w = dict.welcome

  return (
    <div className="flex flex-col gap-14">
      {/* Hero, laid out like the top of the brand board: logo, wordmark, motto. */}
      <section className="glass horizon motion-safe:animate-rise rounded-3xl px-6 pt-10 pb-20 sm:px-12 sm:pt-14 sm:pb-28">
        <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:gap-12 lg:text-left">
          <Image
            src="/brand/logo-v3.webp"
            alt=""
            width={390}
            height={364}
            fetchPriority="high"
            className="brand-art motion-safe:animate-float h-auto w-48 shrink-0 sm:w-64 lg:w-80"
          />
          <div className="flex min-w-0 flex-col items-center gap-5 lg:items-start lg:border-l lg:border-cyan/30 lg:pl-12">
            <p className="text-gradient font-display text-6xl leading-none font-bold tracking-tight sm:text-8xl">
              {dict.brand.name}
            </p>
            <p className="text-xs font-semibold tracking-[0.3em] text-body uppercase sm:text-sm">{dict.brand.motto}</p>
            <h1 className="mt-2 text-3xl leading-tight font-bold sm:text-5xl">
              {w.sloganA} <span className="text-cyan">{w.sloganB}</span>
              <br />
              {w.sloganC} <span className="text-cyan">{w.sloganD}</span>
            </h1>
            <p className="text-lg text-aqua">{dict.brand.tagline}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3 lg:justify-start">
              <ButtonLink href="/sign-in" className="px-8 text-lg">
                {w.cta}
                <Icon name="arrowRight" className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/roadmap" variant="secondary">
                {w.secondaryCta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* The four promises from the bottom of the brand board. */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <li key={f.key} className="motion-safe:animate-rise" style={{ animationDelay: `${120 + i * 80}ms` }}>
            <Card interactive className="flex h-full items-start gap-4 p-5">
              <IconTile name={f.icon} />
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-lg font-semibold">{w.features[f.key].title}</h2>
                <p className="text-sm leading-relaxed text-body">{w.features[f.key].text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {/* The three portals, as large cards like the dashboard design. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-aqua uppercase">{w.portalsTitle}</h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ROLES.map((role) => (
            <li key={role}>
              <Link
                href="/sign-in"
                className="glass glow-edge group flex h-full items-center gap-4 rounded-2xl p-5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-cyan text-on-brand shadow-[0_0_28px_rgb(0_168_255/0.5)]"
                >
                  <Icon name={ROLE_ICONS[role]} className="h-8 w-8" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-display text-lg font-semibold">{dict.portals[role].name}</span>
                  <span className="text-sm text-body">{dict.portals[role].blurb}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/20 text-cyan transition-transform group-hover:translate-x-1"
                >
                  <Icon name="arrowRight" className="h-5 w-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 lg:max-w-4xl">
        <p className="text-base leading-relaxed text-body sm:text-lg sm:leading-relaxed">{dict.description}</p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="shield" className="h-4 w-4 text-cyan" />
          {w.note}
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-aqua uppercase">{w.modulesTitle}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODULES.map((m) => (
            <li key={m.id}>
              <Card interactive className="flex h-full flex-col items-center gap-3 p-5 text-center">
                <IconTile name={MODULE_ICONS[m.id]} size="lg" />
                <span className="font-display text-sm font-semibold sm:text-base">{m.name}</span>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'
import { MODULES } from '@/lib/modules'
import { ROLES } from '@/lib/portals'

export default async function WelcomePage() {
  const { dict } = await getDict()

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
      <section className="flex min-w-0 flex-[3] flex-col gap-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
          {dict.brand.tagline}
        </h1>
        <p className="text-base leading-relaxed text-body sm:text-lg sm:leading-relaxed">{dict.description}</p>
        <div className="flex flex-col gap-3">
          <ButtonLink href="/sign-in" className="self-start px-7 text-lg">
            {dict.welcome.cta}
          </ButtonLink>
          <p className="text-sm text-muted">{dict.welcome.note}</p>
        </div>
      </section>

      <Card className="flex min-w-0 flex-[2] flex-col gap-5 p-6">
        <section className="flex flex-col">
          <h2 className="pb-3 text-sm font-semibold text-muted">{dict.welcome.portalsTitle}</h2>
          {ROLES.map((role) => (
            <div key={role} className="flex flex-col gap-0.5 border-t border-line py-3">
              <span className="font-semibold text-aqua">{dict.portals[role].name}</span>
              <span className="text-sm text-body">{dict.portals[role].blurb}</span>
            </div>
          ))}
        </section>
        <section className="flex flex-col gap-3 border-t border-line pt-4">
          <h2 className="text-sm font-semibold text-muted">{dict.welcome.modulesTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {MODULES.map((m) => (
              <li key={m.id} className="rounded-full bg-soft px-3 py-2 text-sm font-semibold">
                {m.name}
              </li>
            ))}
          </ul>
        </section>
      </Card>
    </div>
  )
}

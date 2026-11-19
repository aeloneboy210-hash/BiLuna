import type { Metadata } from 'next'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Notice } from '@/components/ui/Notice'
import { StatTile } from '@/components/ui/StatTile'
import { requirePortal } from '@/lib/auth/require-portal'
import { SAMPLE_SHARED } from '@/lib/demo/sample'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Healthcare Professional Portal' }

export default async function DoctorPortal() {
  const session = await requirePortal('doctor')
  const { dict } = await getDict()

  const newToday = SAMPLE_SHARED.filter((item) => item.when === 'today').length

  return (
    <PortalShell
      icon="stethoscope"
      portalName={dict.portals.doctor.name}
      title={`${dict.doctor.greeting}, ${session.displayName}`}
      subtitle={dict.doctor.heroSub}
      sampleLabel={dict.common.sampleData}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile icon="share" value={SAMPLE_SHARED.length} label={dict.doctor.sharedCount} />
        <StatTile icon="sparkles" value={newToday} label={dict.doctor.newToday} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-labelledby="shared-title" className="flex min-w-0 flex-[2] flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="shared-title" className="text-xl font-semibold">
              {dict.doctor.title}
            </h2>
            <p className="text-sm text-body">{dict.doctor.intro}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {SAMPLE_SHARED.map((item, i) => {
              const name = dict.sample[item.patient]
              return (
                <li key={item.id} className="motion-safe:animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                  <Card interactive className="flex items-start gap-4 p-5">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-on-brand"
                    >
                      {name.slice(0, 1)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="font-display text-lg font-semibold">{name}</span>
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                          <Icon name="calendar" className="h-4 w-4" />
                          {dict.doctor.shared} {dict.sample[item.when]}
                        </span>
                      </div>
                      <span className="text-xs font-semibold tracking-wide text-aqua uppercase">
                        {dict.doctor.summaryLabel}
                      </span>
                      <p className="leading-relaxed text-body">{dict.sample[item.concern]}</p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
          <p className="text-sm text-muted">{dict.doctor.later}</p>
        </section>

        <aside className="min-w-0 flex-1 lg:sticky lg:top-24">
          <Notice>{dict.doctor.rule}</Notice>
        </aside>
      </div>
    </PortalShell>
  )
}

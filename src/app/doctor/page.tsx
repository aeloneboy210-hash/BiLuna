import type { Metadata } from 'next'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { requirePortal } from '@/lib/auth/require-portal'
import { SAMPLE_SHARED } from '@/lib/demo/sample'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Healthcare Professional Portal' }

export default async function DoctorPortal() {
  await requirePortal('doctor')
  const { dict } = await getDict()

  return (
    <PortalShell
      portalName={dict.portals.doctor.name}
      title={dict.doctor.title}
      sampleLabel={dict.common.sampleData}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-[2] flex-col gap-4">
          <p className="text-sm text-body">{dict.doctor.intro}</p>
          <ul className="flex flex-col gap-3">
            {SAMPLE_SHARED.map((item) => (
              <li key={item.id}>
                <Card className="flex flex-col gap-1.5 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-lg font-semibold">{dict.sample[item.patient]}</span>
                    <span className="text-sm text-muted">
                      {dict.doctor.shared} {dict.sample[item.when]}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted">{dict.doctor.summaryLabel}</span>
                  <p className="leading-relaxed text-body">{dict.sample[item.concern]}</p>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">{dict.doctor.later}</p>
        </section>

        <aside className="min-w-0 flex-1">
          <Notice>{dict.doctor.rule}</Notice>
        </aside>
      </div>
    </PortalShell>
  )
}

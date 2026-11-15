import type { Metadata } from 'next'
import { ModuleMenu } from '@/components/ModuleMenu'
import { PortalShell } from '@/components/PortalShell'
import { QuickAction } from '@/components/QuickAction'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { IconTile } from '@/components/ui/IconTile'
import { SampleTag } from '@/components/ui/SampleTag'
import { requirePortal } from '@/lib/auth/require-portal'
import { SAMPLE_PATIENT_PROFILE } from '@/lib/demo/sample'
import { getDict } from '@/lib/i18n/server'
import { MODULES, moduleHref } from '@/lib/modules'
import type { IconName } from '@/lib/ui/icons'

export const metadata: Metadata = { title: 'Patient Portal' }

const hrefOf = (id: 'health' | 'navigator') => moduleHref(MODULES.find((m) => m.id === id)!)

export default async function PatientPortal() {
  const session = await requirePortal('patient')
  const { dict } = await getDict()

  const profile: [IconName, string, string][] = [
    ['calendar', dict.patient.age, String(SAMPLE_PATIENT_PROFILE.age)],
    ['mapPin', dict.patient.area, dict.sample.areaValue],
    ['droplet', dict.patient.bloodGroup, SAMPLE_PATIENT_PROFILE.bloodGroup],
    ['alert', dict.patient.allergies, dict.sample.none],
    ['activity', dict.patient.conditions, dict.sample.none],
  ]

  return (
    <PortalShell
      icon="user"
      portalName={dict.portals.patient.name}
      title={`${dict.patient.greeting}, ${session.displayName}`}
      subtitle={dict.patient.heroSub}
      actions={
        <>
          <QuickAction primary href={hrefOf('health')} icon="chat" label={dict.patient.askBiluna} />
          <QuickAction href={hrefOf('health')} icon="user" label={dict.patient.whereHurts} />
          <QuickAction href={hrefOf('navigator')} icon="mapPin" label={dict.patient.findCare} />
        </>
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-labelledby="modules-title" className="flex min-w-0 flex-[2] flex-col gap-4">
          <h2 id="modules-title" className="text-xl font-semibold">
            {dict.patient.modulesTitle}
          </h2>
          <ModuleMenu dict={dict} />
        </section>

        <aside className="flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{dict.patient.profileTitle}</h2>
              <SampleTag label={dict.common.sampleData} />
            </div>
            <dl className="flex flex-col">
              {profile.map(([icon, label, value]) => (
                <div key={label} className="flex items-center gap-3 border-t border-line/70 py-3 text-sm">
                  <Icon name={icon} className="h-5 w-5 shrink-0 text-cyan" />
                  <dt className="text-body">{label}</dt>
                  <dd className="ml-auto text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted">{dict.patient.profileNote}</p>
          </Card>

          <Card className="flex items-start gap-4 p-5">
            <IconTile name="activity" size="sm" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{dict.patient.activityTitle}</h2>
              <p className="text-sm leading-relaxed text-body">{dict.patient.activityEmpty}</p>
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-danger/35 bg-danger/10 px-4 py-3.5">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <p className="text-sm leading-relaxed text-body">{dict.common.emergency}</p>
          </div>
        </aside>
      </div>
    </PortalShell>
  )
}

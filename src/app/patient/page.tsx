import type { Metadata } from 'next'
import { ModuleMenu } from '@/components/ModuleMenu'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { SampleTag } from '@/components/ui/SampleTag'
import { requirePortal } from '@/lib/auth/require-portal'
import { SAMPLE_PATIENT_PROFILE } from '@/lib/demo/sample'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Patient Portal' }

export default async function PatientPortal() {
  const session = await requirePortal('patient')
  const { dict } = await getDict()

  const profile: [string, string][] = [
    [dict.patient.age, String(SAMPLE_PATIENT_PROFILE.age)],
    [dict.patient.area, dict.sample.areaValue],
    [dict.patient.bloodGroup, SAMPLE_PATIENT_PROFILE.bloodGroup],
    [dict.patient.allergies, dict.sample.none],
    [dict.patient.conditions, dict.sample.none],
  ]

  return (
    <PortalShell portalName={dict.portals.patient.name} title={`${dict.patient.greeting}, ${session.displayName}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-labelledby="modules-title" className="flex min-w-0 flex-[2] flex-col gap-4">
          <h2 id="modules-title" className="text-lg font-semibold">
            {dict.patient.modulesTitle}
          </h2>
          <ModuleMenu dict={dict} />
        </section>

        <aside className="flex min-w-0 flex-1 flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{dict.patient.profileTitle}</h2>
              <SampleTag label={dict.common.sampleData} />
            </div>
            <dl className="flex flex-col">
              {profile.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-t border-line py-2.5 text-sm">
                  <dt className="text-body">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted">{dict.patient.profileNote}</p>
          </Card>

          <Card className="flex flex-col gap-2 p-5">
            <h2 className="text-lg font-semibold">{dict.patient.activityTitle}</h2>
            <p className="text-sm leading-relaxed text-body">{dict.patient.activityEmpty}</p>
          </Card>

          <p className="text-xs leading-relaxed text-muted">{dict.common.emergency}</p>
        </aside>
      </div>
    </PortalShell>
  )
}

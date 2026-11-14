import type { Metadata } from 'next'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { StatTile } from '@/components/ui/StatTile'
import { requirePortal } from '@/lib/auth/require-portal'
import { SAMPLE_CONCERNS, SAMPLE_ORG_TOTALS } from '@/lib/demo/sample'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Hospitals & Organizations Portal' }

export default async function OrgPortal() {
  await requirePortal('org_admin')
  const { dict } = await getDict()

  const largest = Math.max(...SAMPLE_CONCERNS.map((c) => c.count))

  return (
    <PortalShell
      portalName={dict.portals.org_admin.name}
      title={`${dict.org.orgName} · ${dict.org.title}`}
      sampleLabel={dict.common.sampleData}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile value={SAMPLE_ORG_TOTALS.patients} label={dict.org.patients} />
        <StatTile value={SAMPLE_ORG_TOTALS.conversations} label={dict.org.conversations} />
        <StatTile value={SAMPLE_ORG_TOTALS.shared} label={dict.org.shared} />
        <StatTile value={SAMPLE_ORG_TOTALS.emergencies} label={dict.org.emergencies} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="flex min-w-0 flex-[2] flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">{dict.org.concernsTitle}</h2>
          <ul className="flex flex-col gap-3.5">
            {SAMPLE_CONCERNS.map((c) => (
              <li key={c.key} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-4 text-sm">
                  <span>{dict.org[c.key]}</span>
                  <span className="font-semibold">{c.count}</span>
                </div>
                <div aria-hidden="true" className="h-3 rounded-full bg-soft">
                  <div className="h-3 rounded-full bg-brand" style={{ width: `${(c.count / largest) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <aside className="min-w-0 flex-1">
          <Notice>{dict.org.rule}</Notice>
        </aside>
      </div>
    </PortalShell>
  )
}

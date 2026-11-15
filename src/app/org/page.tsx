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

  const total = SAMPLE_CONCERNS.reduce((sum, c) => sum + c.count, 0)
  const largest = Math.max(...SAMPLE_CONCERNS.map((c) => c.count))
  // Largest first, with "Other" always last because it is not a single concern.
  const ranked = [...SAMPLE_CONCERNS].sort((a, b) =>
    a.key === 'other' ? 1 : b.key === 'other' ? -1 : b.count - a.count,
  )

  return (
    <PortalShell
      icon="hospital"
      portalName={dict.portals.org_admin.name}
      title={`${dict.org.orgName} · ${dict.org.title}`}
      subtitle={dict.org.heroSub}
      sampleLabel={dict.common.sampleData}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon="users" value={SAMPLE_ORG_TOTALS.patients} label={dict.org.patients} />
        <StatTile icon="chat" value={SAMPLE_ORG_TOTALS.conversations} label={dict.org.conversations} />
        <StatTile icon="share" value={SAMPLE_ORG_TOTALS.shared} label={dict.org.shared} />
        <StatTile icon="alert" tone="danger" value={SAMPLE_ORG_TOTALS.emergencies} label={dict.org.emergencies} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="flex min-w-0 flex-[2] flex-col gap-5 p-6 sm:p-7">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{dict.org.concernsTitle}</h2>
            <p className="text-sm text-muted">
              {total} {dict.org.conversations.toLowerCase()}
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {ranked.map((c, i) => {
              const share = Math.round((c.count / total) * 100)
              return (
                <li key={c.key} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-semibold">{dict.org[c.key]}</span>
                    <span className="text-sm text-body">
                      <span className="font-display text-base font-bold text-ink">{c.count}</span>
                      <span className="ml-2 text-muted">
                        {share}% {dict.org.ofAll}
                      </span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-soft/70">
                    <div
                      className={`grow-x h-3 rounded-full shadow-[0_0_14px_rgb(0_224_255/0.55)] ${
                        c.key === 'other' ? 'bg-muted/70' : 'bg-linear-to-r from-brand to-cyan'
                      }`}
                      style={{ width: `${(c.count / largest) * 100}%`, animationDelay: `${i * 90}ms` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <aside className="min-w-0 flex-1 lg:sticky lg:top-24">
          <Notice>{dict.org.rule}</Notice>
        </aside>
      </div>
    </PortalShell>
  )
}

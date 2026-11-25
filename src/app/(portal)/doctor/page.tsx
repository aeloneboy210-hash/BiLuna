import type { Metadata } from 'next'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Notice } from '@/components/ui/Notice'
import { StatTile } from '@/components/ui/StatTile'
import { requirePortal } from '@/lib/auth/require-portal'
import Link from 'next/link'
import { sharedWithMe } from '@/lib/consult/store'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Healthcare Professional Portal' }

export default async function DoctorPortal() {
  const session = await requirePortal('doctor')
  const { dict, lang } = await getDict()
  // Only summaries a patient chose to share, and still shares: the database decides.
  const shared = await sharedWithMe()
  const dhakaDay = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600_000).toISOString().slice(0, 10)
  const today = dhakaDay(new Date().toISOString())
  const newToday = shared.filter((s) => dhakaDay(s.sharedAt) === today).length
  const when = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))

  return (
    <PortalShell
      icon="stethoscope"
      portalName={dict.portals.doctor.name}
      title={`${dict.doctor.greeting}, ${session.displayName}`}
      subtitle={dict.doctor.heroSub}
      sampleLabel={dict.common.sampleData}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile icon="share" value={shared.length} label={dict.doctor.sharedCount} />
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
          {shared.length === 0 ? (
            <Card className="p-5 text-body">{dict.doctor.none}</Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {shared.map((item, i) => (
                <li key={item.id} className="motion-safe:animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                  <Link href={`/doctor/summary/${item.id}`} className="block rounded-2xl">
                    <Card interactive className="flex items-start gap-4 p-5">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-on-brand"
                      >
                        {item.patientName.slice(0, 1)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="font-display text-lg font-semibold">{item.patientName}</span>
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                            <Icon name="calendar" className="h-4 w-4" />
                            {dict.doctor.shared} {when(item.sharedAt)}
                          </span>
                        </div>
                        <span className="text-xs font-semibold tracking-wide text-aqua uppercase">{dict.doctor.summaryLabel}</span>
                        <p className="leading-relaxed text-body">{item.content.concern}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-brand">{dict.doctor.open} →</span>
                          {item.review ? (
                            <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                              ✅ {dict.doctor.replied}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="min-w-0 flex-1 lg:sticky lg:top-24">
          <Notice>{dict.doctor.rule}</Notice>
        </aside>
      </div>
    </PortalShell>
  )
}

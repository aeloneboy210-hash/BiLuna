import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SummaryView } from '@/components/consult/SummaryView'
import { PortalShell } from '@/components/PortalShell'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { requirePortal } from '@/lib/auth/require-portal'
import { sharedSummary } from '@/lib/consult/store'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Shared summary' }

/** One summary a patient shared. If the patient stops sharing, this page stops opening (the database refuses). */
export default async function SharedSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePortal('doctor')
  const { id } = await params
  const { dict, lang } = await getDict()
  const summary = /^[0-9a-f-]{36}$/i.test(id) ? await sharedSummary(id) : null
  if (!summary) notFound()
  const when = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(summary.sharedAt))

  return (
    <PortalShell
      icon="stethoscope"
      portalName={dict.portals.doctor.name}
      title={summary.patientName}
      subtitle={`${dict.doctor.summaryLabel} · ${dict.doctor.shared} ${when}`}
      sampleLabel={dict.common.sampleData}
    >
      <Link href="/doctor" className="self-start text-sm font-semibold text-brand hover:underline">
        ← {dict.doctor.back}
      </Link>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="min-w-0 flex-[2] p-5 sm:p-6">
          <SummaryView content={summary.content} t={{ ...dict.summary, note: dict.summary.patientNote }} />
        </Card>
        <aside className="flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-24">
          <Notice>{dict.doctor.readOnly}</Notice>
          <p className="text-sm text-muted">{dict.doctor.later}</p>
        </aside>
      </div>
    </PortalShell>
  )
}

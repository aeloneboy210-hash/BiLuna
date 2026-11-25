import { Icon } from '@/components/ui/Icon'
import type { PatientSummary } from '@/lib/consult/store'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

/** The doctor's note as the patient sees it, clearly marked as written by the doctor and not by BiLuna. */
export function DoctorReply({
  review,
  lang,
  t,
}: {
  review: NonNullable<PatientSummary['review']>
  lang: Lang
  t: Dictionary['review']
}) {
  const when = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(review.updatedAt))
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-brand/40 bg-surface px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold text-brand">
        <Icon name="stethoscope" className="h-4 w-4" />
        {t.fromDoctor} {review.doctorName}
      </p>
      <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">{review.body}</p>
      <p className="text-xs text-muted">
        {when} · {t.byDoctor}
      </p>
    </div>
  )
}

import { Icon } from '@/components/ui/Icon'
import type { PatientSummary } from '@/lib/consult/store'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'
import { formatDhaka } from '@/lib/ui/dhaka-time'

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
  const when = formatDhaka(review.updatedAt, lang)
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-brand/40 bg-surface px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold text-brand">
        <Icon name="stethoscope" className="h-4 w-4" />
        {t.fromDoctor.replace('{name}', review.doctorName)}
      </p>
      <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">{review.body}</p>
      <p className="text-xs text-muted">
        {when} · {t.byDoctor}
      </p>
      {review.older ? <p className="text-xs font-semibold text-warn">⚠️ {t.older}</p> : null}
    </div>
  )
}

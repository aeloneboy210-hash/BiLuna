import type { SummaryContent } from '@/lib/consult/summary'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

type T = Dictionary['summary']

/**
 * The summary's sections, shown the same way to the patient and the doctor. Empty sections are left out.
 * contentLang marks what BiLuna wrote with its language, so a screen reader reads Bangla in a Bangla voice
 * even when the headings around it are English (a doctor reading a Bangla summary).
 */
export function SummaryView({ content, t, contentLang }: { content: SummaryContent; t: T; contentLang?: Lang }) {
  const facts = (['where', 'pain', 'since'] as const).filter((k) => content[k])
  const lists = (['symptoms', 'possibilities', 'medicines', 'questions', 'redFlags'] as const).filter((k) => content[k].length)
  return (
    <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-ink">
      <div>
        <p className="text-xs font-semibold tracking-wide text-aqua uppercase">{t.concern}</p>
        <p className="font-semibold" lang={contentLang}>
          {content.concern}
        </p>
      </div>
      {facts.length ? (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {facts.map((k) => (
            <div key={k} className="rounded-xl bg-soft px-3 py-2">
              <dt className="text-xs text-muted">{t[k]}</dt>
              <dd className="font-semibold" lang={contentLang}>
                {content[k]}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {lists.map((k) => (
        <div key={k}>
          <p className={`text-xs font-semibold tracking-wide uppercase ${k === 'redFlags' ? 'text-danger' : 'text-aqua'}`}>{t[k]}</p>
          <ul className="mt-1 list-disc pl-5" lang={contentLang}>
            {content[k].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      {content.note ? (
        <div className="rounded-xl border border-line px-3 py-2">
          <p className="text-xs font-semibold text-muted">{t.note}</p>
          <p className="whitespace-pre-wrap">{content.note}</p>
        </div>
      ) : null}
      <p className="text-xs text-muted">{t.notDiagnosis}</p>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { prepareSummary, updateSummary } from '@/app/(portal)/patient/health/actions'
import { SummaryView } from '@/components/consult/SummaryView'
import { Icon } from '@/components/ui/Icon'
import type { PatientSummary } from '@/lib/consult/store'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

type T = Dictionary['summary']
type ErrorKey = keyof T['errors']

const dateFmt = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))

/**
 * Consultation Prep: BiLuna turns the chat into a summary, the patient checks it, adds a note, and chooses
 * to share it with the demo doctor, or to stop sharing. Nothing is shared without the patient's tap.
 */
export function SummaryPanel({
  conversationId,
  initial,
  doctorName,
  lang,
  onClose,
  onChange,
  t,
}: {
  conversationId: string
  initial: PatientSummary | null
  doctorName: string
  lang: Lang
  onClose: () => void
  onChange: (s: PatientSummary) => void
  t: T
}) {
  const [summary, setSummary] = useState<PatientSummary | null>(initial)
  const [note, setNote] = useState(initial?.content.note ?? '')
  const [making, setMaking] = useState(!initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)
  const started = useRef(false)

  async function make() {
    setMaking(true)
    setError(null)
    const r = await prepareSummary({ conversationId, lang })
    setMaking(false)
    if (!r.ok) return setError(r.error)
    setSummary(r.summary)
    onChange(r.summary)
    setNote(r.summary.content.note)
    setSaved(false)
  }

  // A chat with no summary yet gets one as soon as the panel opens.
  useEffect(() => {
    if (initial || started.current) return
    started.current = true
    void make()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function act(action: 'note' | 'share' | 'stop') {
    if (!summary) return
    setBusy(true)
    setError(null)
    const next = await updateSummary({ conversationId, summaryId: summary.id, action, note })
    setBusy(false)
    if (!next) return setError('update')
    setSummary(next)
    onChange(next)
    if (action === 'note') setSaved(true)
  }

  return (
    <section aria-labelledby="prep-title" className="flex flex-col gap-4 rounded-2xl border border-tint bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id="prep-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Icon name="share" className="h-5 w-5 text-brand" />
            {t.title}
          </h3>
          <p className="text-sm text-body">{t.intro}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 shrink-0 rounded-full border border-line px-3 text-sm text-body hover:bg-soft"
        >
          {t.close}
        </button>
      </div>

      {making ? (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold text-brand">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          {t.making}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
          {t.errors[error]}
        </p>
      ) : null}

      {summary && !making ? (
        <>
          <SummaryView content={{ ...summary.content, note: '' }} t={t} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t.note}</span>
            <textarea
              value={note}
              maxLength={500}
              rows={3}
              onChange={(e) => {
                setNote(e.target.value)
                setSaved(false)
              }}
              placeholder={t.notePlaceholder}
              className="rounded-xl border border-field bg-surface px-3 py-2 text-[0.95rem] text-ink"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || note === summary.content.note}
              onClick={() => act('note')}
              className="min-h-10 rounded-full border border-brand px-4 text-sm font-semibold text-brand hover:bg-soft disabled:opacity-50"
            >
              {t.saveNote}
            </button>
            {saved ? <span className="text-sm text-muted">✓ {t.saved}</span> : null}
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-soft p-3">
            {summary.sharedAt ? (
              <>
                <p className="text-sm font-semibold text-ink">
                  ✅ {t.sharedWith} {summary.doctorName ?? doctorName} · {dateFmt(summary.sharedAt, lang)}
                </p>
                <p className="text-xs text-muted">{t.stopNote}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act('stop')}
                  className="min-h-11 self-start rounded-full border-2 border-danger px-5 text-sm font-bold text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  {t.stop}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-body">{t.notShared}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act('share')}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 text-base font-bold text-on-brand hover:bg-aqua disabled:opacity-60"
                >
                  <Icon name="share" className="h-5 w-5" />
                  {t.shareWith} {doctorName}
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => make()}
            className="self-start text-sm font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
          >
            {t.remake}
          </button>
        </>
      ) : null}
    </section>
  )
}

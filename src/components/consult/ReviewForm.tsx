'use client'

import { useState } from 'react'
import { saveDoctorNote } from '@/app/(portal)/doctor/summary/[id]/actions'
import { Icon } from '@/components/ui/Icon'
import type { Review } from '@/lib/consult/store'
import { REVIEW_MAX } from '@/lib/consult/review'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'
import { formatDhaka } from '@/lib/ui/dhaka-time'

type T = Dictionary['review']

const dateFmt = (iso: string, lang: Lang) =>
  formatDhaka(iso, lang)

/** The doctor's note on a shared summary. It goes to the patient as soon as it is saved. */
export function ReviewForm({ summaryId, initial, lang, t }: { summaryId: string; initial: Review | null; lang: Lang; t: T }) {
  const [review, setReview] = useState<Review | null>(initial)
  const [text, setText] = useState(initial?.body ?? '')
  const [editing, setEditing] = useState(!initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function save() {
    setBusy(true)
    setError(false)
    const saved = await saveDoctorNote({ summaryId, body: text })
    setBusy(false)
    if (!saved) return setError(true)
    setReview(saved)
    setText(saved.body)
    setEditing(false)
  }

  return (
    <section aria-labelledby="review-title" className="flex flex-col gap-3">
      <h2 id="review-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <Icon name="stethoscope" className="h-5 w-5 text-brand" />
        {t.title}
      </h2>
      {review && !editing ? (
        <>
          <div className="rounded-xl border border-brand/30 bg-soft px-4 py-3">
            <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">{review.body}</p>
            <p className="mt-2 text-xs text-muted">
              ✅ {t.sent} · {dateFmt(review.updatedAt, lang)}
            </p>
            {review.older ? <p className="mt-1 text-xs font-semibold text-warn">⚠️ {t.older}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-10 self-start rounded-full border border-brand px-4 text-sm font-semibold text-brand hover:bg-soft"
          >
            {t.edit}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-body">{t.intro}</p>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">{t.title}</span>
            <textarea
              value={text}
              maxLength={REVIEW_MAX}
              rows={5}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              className="rounded-xl border border-field bg-surface px-3 py-2 text-[0.95rem] text-ink"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || !text.trim()}
              onClick={save}
              className="flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-on-brand hover:bg-aqua disabled:opacity-50"
            >
              <Icon name="send" className="h-4 w-4" />
              {busy ? t.sending : t.send}
            </button>
            {review ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setText(review.body)
                  setEditing(false)
                }}
                className="min-h-11 rounded-full border border-line px-4 text-sm text-body hover:bg-soft"
              >
                {t.cancel}
              </button>
            ) : null}
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
          {t.error}
        </p>
      ) : null}
      <p className="text-xs text-muted">{t.fictional}</p>
    </section>
  )
}

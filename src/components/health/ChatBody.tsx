'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { BodyLayers } from '@/components/body/BodyViewer'
import type { BodyPoint } from '@/lib/body/chat-body'
import { painFace, pointName } from '@/lib/body/chat-body'
import { BODY_PARTS, type OrganId, type RegionId } from '@/lib/body/regions'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

type T = Dictionary['health']['body']

/** three.js loads only when a 3D view opens, so the chat itself stays light. */
const BodyViewer = dynamic(() => import('@/components/body/BodyViewer').then((m) => m.BodyViewer), { ssr: false })

const ALL_LAYERS: BodyLayers = { skeleton: true, organs: true }

/** The area buttons under the body, top to bottom. */
const AREAS: RegionId[] = [
  'head',
  'neck',
  'chest',
  'upperAbdomen',
  'lowerAbdomen',
  'upperBack',
  'lowerBack',
  'leftArm',
  'rightArm',
  'leftLeg',
  'rightLeg',
]

/** The 3D body above the message box: tap where it hurts. */
export function BodyPicker({
  point,
  onPoint,
  onPain,
  onClose,
  lang,
  t,
}: {
  point: BodyPoint | null
  onPoint: (p: BodyPoint) => void
  onPain: (n: number) => void
  onClose: () => void
  lang: Lang
  t: T
}) {
  const [focus, setFocus] = useState<{ region: RegionId; n: number } | null>(null)
  const [ready, setReady] = useState(false)
  const chooseArea = (region: RegionId) => {
    onPoint({ region, part: null, spot: null })
    setFocus((f) => ({ region, n: (f?.n ?? 0) + 1 }))
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-ink">{t.pickTitle}</p>
          <p className="text-xs text-muted">{t.pickHint}</p>
        </div>
        <button type="button" onClick={onClose} className="min-h-9 rounded-full border border-line px-3 text-sm text-body hover:bg-soft">
          {t.close}
        </button>
      </div>
      <div className="relative h-[58vh] max-h-[34rem] min-h-80 overflow-hidden rounded-xl bg-soft">
        {/* A scan line sweeps down the body once it is on screen. */}
        {ready ? (
          <>
            <div className="body-scan pointer-events-none absolute inset-x-0 z-10 h-1 rounded-full bg-brand" aria-hidden="true" />
            <p className="body-scan-label pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-brand">
              {t.scanning}
            </p>
          </>
        ) : null}
        <BodyViewer
          compact
          picker
          focus={focus}
          onLoaded={() => setReady(true)}
          controlLabels={t.views}
          highlight={null}
          layers={ALL_LAYERS}
          onPick={(p) => onPoint(p)}
          label={t.label}
          loadingText={t.loading}
          failedText={t.failed}
        />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted">{t.areas}</p>
        <div className="flex flex-wrap gap-1.5">
          {AREAS.map((region) => {
            const on = point?.region === region && !point.part
            return (
              <button
                key={region}
                type="button"
                onClick={() => chooseArea(region)}
                aria-pressed={on}
                className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink hover:bg-soft'}`}
              >
                {BODY_PARTS[region][lang]}
              </button>
            )
          })}
        </div>
      </div>
      {point ? (
        <div className="rounded-xl border border-tint bg-soft p-3">
          <p className="mb-2 text-sm font-bold text-ink">{t.painTitle}</p>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = point.pain === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPain(n)}
                  aria-pressed={on}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-sm font-bold ${on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink hover:bg-surface/60'}`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {painFace(n)}
                  </span>
                  {n}
                </button>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{t.painLow}</span>
            <span>{t.painHigh}</span>
          </div>
        </div>
      ) : null}
      {point ? (
        <p className="text-sm text-body">
          {t.pointed}: <span className="font-semibold text-ink">{pointName(point, lang)}</span>
        </p>
      ) : null}
    </div>
  )
}

/** The chip above the message box showing where the patient pointed. */
export function PointChip({ point, onClear, lang, t }: { point: BodyPoint; onClear: () => void; lang: Lang; t: T }) {
  return (
    <div className="flex items-center gap-2 self-start rounded-full border border-tint bg-soft py-1 pr-1 pl-3 text-sm font-semibold text-ink">
      <span aria-hidden="true">📍</span>
      <span>
        {pointName(point, lang)}
        {point.pain ? ` · ${painFace(point.pain)} ${point.pain}/10` : ''}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t.clear}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface"
      >
        ✕
      </button>
    </div>
  )
}

/** Under a reply: the organ that may be involved, lit up in 3D. Never shown as the cause. */
export function BodyCard({ organ, open, onToggle, lang, t }: { organ: OrganId; open: boolean; onToggle: () => void; lang: Lang; t: T }) {
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-tint bg-soft p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="body" className="h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm text-ink">
            {t.mayBe} <span className="font-bold">{BODY_PARTS[organ][lang]}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="min-h-9 rounded-full bg-brand px-3 text-sm font-semibold text-on-brand hover:bg-aqua"
        >
          {open ? t.hide : t.show}
        </button>
      </div>
      {open ? (
        <div className="relative h-80 overflow-hidden rounded-lg bg-surface sm:h-96">
          <BodyViewer
            compact
            highlight={organ}
            layers={ALL_LAYERS}
            controlLabels={t.views}
            label={`${t.label}: ${BODY_PARTS[organ][lang]}`}
            loadingText={t.loading}
            failedText={t.failed}
          />
        </div>
      ) : null}
      <p className="text-xs text-muted">{t.notCause}</p>
    </div>
  )
}

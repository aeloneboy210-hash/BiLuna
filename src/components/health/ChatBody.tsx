'use client'

import dynamic from 'next/dynamic'
import { Icon } from '@/components/ui/Icon'
import type { BodyLayers } from '@/components/body/BodyViewer'
import type { BodyPoint } from '@/lib/body/chat-body'
import { pointName } from '@/lib/body/chat-body'
import { BODY_PARTS, type OrganId } from '@/lib/body/regions'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

type T = Dictionary['health']['body']

/** three.js loads only when a 3D view opens, so the chat itself stays light. */
const BodyViewer = dynamic(() => import('@/components/body/BodyViewer').then((m) => m.BodyViewer), { ssr: false })

const ALL_LAYERS: BodyLayers = { skeleton: true, organs: true }

/** The 3D body above the message box: tap where it hurts. */
export function BodyPicker({
  point,
  onPoint,
  onClose,
  lang,
  t,
}: {
  point: BodyPoint | null
  onPoint: (p: BodyPoint) => void
  onClose: () => void
  lang: Lang
  t: T
}) {
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
      <div className="relative h-72 overflow-hidden rounded-xl bg-soft sm:h-80">
        <BodyViewer
          compact
          highlight={point?.part?.id ?? null}
          layers={ALL_LAYERS}
          onPick={(p) => onPoint(p)}
          label={t.label}
          loadingText={t.loading}
          failedText={t.failed}
        />
      </div>
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
      <span>{pointName(point, lang)}</span>
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
export function BodyCard({
  organ,
  open,
  onToggle,
  lang,
  t,
}: {
  organ: OrganId
  open: boolean
  onToggle: () => void
  lang: Lang
  t: T
}) {
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
        <div className="relative h-64 overflow-hidden rounded-lg bg-surface sm:h-72">
          <BodyViewer compact highlight={organ} layers={ALL_LAYERS} label={`${t.label}: ${BODY_PARTS[organ][lang]}`} loadingText={t.loading} failedText={t.failed} />
        </div>
      ) : null}
      <p className="text-xs text-muted">{t.notCause}</p>
    </div>
  )
}

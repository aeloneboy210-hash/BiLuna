'use client'

import { useState } from 'react'
import { BodyViewer, type BodyPick, type BodyVariant } from '@/components/body/BodyViewer'
import { BODY_PARTS, type OrganId, type PartId } from '@/lib/body/regions'
import type { Lang } from '@/lib/i18n/lang'

const DEMO_LIGHTS: OrganId[] = ['lungs', 'heart', 'stomach', 'liver', 'brain', 'intestines', 'kidneys', 'bladder']

/** Owner's test page: the same features on both 3D bodies, to choose one. */
export function BodyLab({ lang }: { lang: Lang }) {
  const [variant, setVariant] = useState<BodyVariant>('stylized')
  const [lit, setLit] = useState<PartId | null>('lungs')
  const [pick, setPick] = useState<BodyPick | null>(null)
  const [load, setLoad] = useState<Partial<Record<BodyVariant, { ms: number; bytes: number }>>>({})
  const name = (p: PartId) => BODY_PARTS[p][lang]

  const tab = (v: BodyVariant, title: string) => (
    <button
      type="button"
      onClick={() => {
        setVariant(v)
        setPick(null)
      }}
      aria-pressed={variant === v}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold ${variant === v ? 'bg-brand text-on-brand' : 'text-body hover:bg-soft'}`}
    >
      {title}
    </button>
  )

  const info = load[variant]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">3D body: compare A and B</h1>
        <p className="text-body">Drag to turn the body. Tap a spot to pick it. Use the buttons to light up a part as &ldquo;may be involved&rdquo;.</p>
      </div>

      <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
        {tab('stylized', 'A · BiLuna style')}
        {tab('anatomy', 'B · Real anatomy')}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="glass relative h-[60vh] min-h-96 overflow-hidden rounded-2xl">
          <BodyViewer
            key={variant}
            variant={variant}
            highlight={lit}
            onPick={(p) => {
              setPick(p)
              setLit(p.organ ?? p.region)
            }}
            onLoaded={(i) => setLoad((l) => ({ ...l, [variant]: i }))}
            label="3D body"
          />
          <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted">
            {info ? (info.bytes ? `Loaded ${Math.round(info.bytes / 1024)} KB in ${info.ms} ms` : `Built in ${info.ms} ms · 0 KB download`) : 'Loading…'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass flex flex-col gap-2 rounded-2xl p-4">
            <h2 className="font-bold">You tapped</h2>
            {pick ? (
              <p className="text-ink">
                <span className="font-semibold">{name(pick.region)}</span>
                {pick.organ ? <> · near the {name(pick.organ).toLowerCase()}</> : null}
              </p>
            ) : (
              <p className="text-sm text-muted">Nothing yet. Tap the body.</p>
            )}
            <p className="text-xs text-muted">In the chat, BiLuna will use this spot in its questions and answer.</p>
          </div>

          <div className="glass flex flex-col gap-2 rounded-2xl p-4">
            <h2 className="font-bold">Light up (may be involved)</h2>
            <div className="flex flex-wrap gap-2">
              {DEMO_LIGHTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setLit(o)}
                  aria-pressed={lit === o}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${lit === o ? 'border-brand bg-brand text-on-brand' : 'border-line text-body hover:bg-soft'}`}
                >
                  {name(o)}
                </button>
              ))}
              <button type="button" onClick={() => setLit(null)} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:bg-soft">
                None
              </button>
            </div>
            {variant === 'anatomy' && lit === 'kidneys' ? (
              <p className="text-xs text-warn">Kidneys are left out of B: that part of the free model is non-commercial only.</p>
            ) : null}
          </div>

          {variant === 'anatomy' ? (
            <p className="text-xs leading-relaxed text-muted">
              Model: derived from Z-Anatomy (CC BY-SA 4.0) and BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan).
              Shared under CC BY-SA 4.0.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted">Built by BiLuna from simple shapes. Organ positions are approximate, for orientation only.</p>
          )}
        </div>
      </div>
    </div>
  )
}

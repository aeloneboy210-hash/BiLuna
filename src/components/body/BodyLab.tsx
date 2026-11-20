'use client'

import { useMemo, useState } from 'react'
import { BodyViewer, type BodyLayers, type BodyPick } from '@/components/body/BodyViewer'
import { describePart } from '@/lib/body/anatomy'
import { BODY_PARTS, type OrganId } from '@/lib/body/regions'
import type { Lang } from '@/lib/i18n/lang'

const DEMO_LIGHTS: OrganId[] = ['brain', 'lungs', 'heart', 'liver', 'stomach', 'intestines', 'kidneys', 'bladder', 'pancreas', 'spleen']

/** Test page for the 3D body: every bone and organ, layers, tap to name, light up. */
export function BodyLab({ lang }: { lang: Lang }) {
  const [lit, setLit] = useState<string | null>('lungs')
  const [pick, setPick] = useState<BodyPick | null>(null)
  const [layers, setLayers] = useState<BodyLayers>({ skeleton: true, organs: true })
  const [info, setInfo] = useState<{ ms: number; bytes: number; parts: number } | null>(null)
  const stableLayers = useMemo(() => layers, [layers])

  const toggle = (k: keyof BodyLayers, title: string) => (
    <button
      type="button"
      onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}
      aria-pressed={layers[k]}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold ${layers[k] ? 'bg-brand text-on-brand' : 'text-body hover:bg-soft'}`}
    >
      {title}
    </button>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">3D body: every bone and organ</h1>
        <p className="text-body">Drag to turn, pinch or scroll to zoom in. Tap any bone or organ to see its name.</p>
      </div>

      <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
        {toggle('skeleton', 'Bones')}
        {toggle('organs', 'Organs')}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="glass relative h-[65vh] min-h-96 overflow-hidden rounded-2xl">
          <BodyViewer
            highlight={lit}
            layers={stableLayers}
            onPick={(p) => {
              setPick(p)
              if (p.part) setLit(p.part.id)
            }}
            onLoaded={setInfo}
            label="3D body"
          />
          <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted">
            {info ? `${info.parts} parts · ${Math.round(info.bytes / 1024)} KB · ${info.ms} ms` : 'Loading…'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass flex flex-col gap-2 rounded-2xl p-4">
            <h2 className="font-bold">You tapped</h2>
            {pick?.part ? (
              <p className="font-semibold text-ink">{describePart(pick.part, lang)}</p>
            ) : (
              <p className="text-sm text-muted">Nothing yet. Tap a bone or organ.</p>
            )}
            {pick ? <p className="text-sm text-body">Area: {BODY_PARTS[pick.region][lang]}</p> : null}
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
                  {BODY_PARTS[o][lang]}
                </button>
              ))}
              <button type="button" onClick={() => setLit(null)} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:bg-soft">
                None
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            3D model derived from Z-Anatomy (CC BY-SA 4.0) and BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan),
            shared under CC BY-SA 4.0. Kidneys: &ldquo;Kidney&rdquo; by Lissie Cowley (CC BY-NC 4.0), used non-commercially.
          </p>
        </div>
      </div>
    </div>
  )
}

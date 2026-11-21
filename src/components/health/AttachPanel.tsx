'use client'

import { useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type T = Dictionary['health']['attach']

/** Opens above the message box: choose a photo or PDF, or try one of the two fictional samples. */
export function AttachPanel({
  onFile,
  onSample,
  onClose,
  busy,
  t,
}: {
  onFile: (file: File) => void
  onSample: (path: string, name: string) => void
  onClose: () => void
  busy: boolean
  t: T
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-ink">{t.title}</p>
          <p className="text-xs text-muted">{t.hint}</p>
        </div>
        <button type="button" onClick={onClose} className="min-h-9 rounded-full border border-line px-3 text-sm text-body hover:bg-soft">
          {t.close}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 text-base font-bold text-on-brand hover:bg-aqua disabled:opacity-60"
      >
        <Icon name="clip" className="h-5 w-5" />
        {t.choose}
      </button>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSample('/samples/sample-lab-report.jpg', 'Sample lab report.jpg')}
          className="min-h-10 rounded-full border border-brand px-4 text-sm font-semibold text-brand hover:bg-soft disabled:opacity-60"
        >
          🧪 {t.sampleReport}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSample('/samples/sample-handwritten-prescription.jpg', 'Sample handwritten prescription.jpg')}
          className="min-h-10 rounded-full border border-brand px-4 text-sm font-semibold text-brand hover:bg-soft disabled:opacity-60"
        >
          ✍️ {t.sampleHandwritten}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSample('/samples/sample-prescription.jpg', 'Sample prescription.jpg')}
          className="min-h-10 rounded-full border border-brand px-4 text-sm font-semibold text-brand hover:bg-soft disabled:opacity-60"
        >
          💊 {t.samplePrescription}
        </button>
      </div>
      <p className="text-xs text-muted">{t.sampleNote}</p>
    </div>
  )
}

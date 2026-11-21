'use client'

import { Icon } from '@/components/ui/Icon'
import type { DangerKind } from '@/lib/health/danger'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type T = Dictionary['health']['danger']

const callClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-danger px-5 text-base font-bold text-surface hover:opacity-90'

/**
 * Shown under a patient message that matched the fixed danger-word list, before BiLuna answers.
 * It does not depend on the AI. Self-harm gets a gentler card with an emotional-support line.
 */
export function EmergencyCard({ kind, onSafe, t }: { kind: DangerKind; onSafe?: () => void; t: T }) {
  const selfHarm = kind === 'selfHarm'
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="motion-safe:animate-rise flex flex-col gap-3 self-stretch rounded-2xl border-2 border-danger bg-danger/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger text-surface">
          <Icon name="alert" className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-danger">{selfHarm ? t.selfHarmTitle : t.title}</h3>
          <p className="text-[0.95rem] leading-relaxed text-ink">
            {selfHarm ? t.selfHarmText : t.tips[kind as Exclude<DangerKind, 'selfHarm'>]}
          </p>
        </div>
      </div>
      {selfHarm ? null : (
        <p className="text-sm font-semibold text-ink">
          {t.call} <span className="font-normal text-body">· {t.callNote}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <a href="tel:999" className={callClass}>
          📞 {t.call999}
        </a>
        {selfHarm ? (
          <a
            href="tel:09612119911"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-danger bg-surface px-5 text-base font-bold text-danger hover:bg-danger/10"
          >
            💙 {t.callKpr}
          </a>
        ) : null}
        {onSafe ? (
          <button
            type="button"
            onClick={onSafe}
            className="min-h-12 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-body hover:bg-soft"
          >
            {t.safe}
          </button>
        ) : null}
      </div>
      {selfHarm ? (
        <div className="text-sm text-ink">
          <p className="font-semibold">{t.kpr}</p>
          <p className="text-body">{t.kprHours}</p>
          <p className="mt-1">{t.selfHarmTip}</p>
        </div>
      ) : null}
      <p className="text-xs text-muted">{t.demoNote}</p>
    </section>
  )
}

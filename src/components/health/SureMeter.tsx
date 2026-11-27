import type { Lang } from '@/lib/i18n/lang'
import { METER_WORDS, sureLevel } from '@/lib/health/sure-meter'

const BAR_COLORS = ['bg-[#f59e0b]', 'bg-[#2580eb]', 'bg-[#1a64c8]']

/**
 * BiLuna's "How sure I am" line as a small meter: three steps BiLuna can fill, and a fourth that only a
 * doctor fills. The words stay exactly what BiLuna wrote.
 */
export function SureMeter({ lang, text }: { lang: Lang; text: string }) {
  const words = METER_WORDS[lang]
  const level = sureLevel(text)
  return (
    <div
      lang={lang}
      className="sure-meter mt-1 overflow-hidden rounded-2xl border border-tint bg-gradient-to-br from-soft via-surface to-[#fff7e6] p-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand">
          <span aria-hidden className="sure-meter-icon text-base">🧭</span>
          {words.title}
        </span>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={level}
          aria-label={`${words.title}: ${words.levels[level]}`}
          className="flex items-end gap-1"
        >
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              style={{ height: `${8 + step * 4}px`, animationDelay: `${step * 140}ms` }}
              className={`sure-meter-bar w-2.5 rounded-sm ${step <= level ? BAR_COLORS[level - 1] : 'bg-line'}`}
            />
          ))}
          <span
            title={words.doctor}
            className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-ok text-xs"
            aria-hidden
          >
            🩺
          </span>
          <span className="ml-1.5 text-xs font-semibold text-ink">{words.levels[level]}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{text}</p>
      <p className="mt-1.5 text-xs text-ok">🩺 {words.doctor}</p>
    </div>
  )
}

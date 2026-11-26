import { Icon } from '@/components/ui/Icon'
import { setLang } from '@/lib/i18n/actions'
import type { Lang } from '@/lib/i18n/lang'

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'bn', label: 'বাংলা' },
]

/**
 * The Settings button: opens a small menu where the whole site's language can be changed. BiLuna opens in
 * English; the choice is kept in a cookie. Works without JavaScript (a native disclosure and plain forms).
 */
export function SettingsMenu({ current, t }: { current: Lang; t: { settings: string; language: string } }) {
  return (
    <details className="group relative">
      <summary
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-brand hover:bg-soft [&::-webkit-details-marker]:hidden"
        aria-label={t.settings}
        title={t.settings}
      >
        <Icon name="settings" className="h-5 w-5" />
        <span className="hidden sm:inline">{t.settings}</span>
      </summary>
      <div className="glass absolute right-0 z-30 mt-2 flex w-48 flex-col gap-2 rounded-2xl p-3 shadow-lg">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t.language}</p>
        <div role="group" aria-label={t.language} className="flex flex-col gap-1">
          {OPTIONS.map((option) => {
            const active = option.lang === current
            return (
              <form key={option.lang} action={setLang.bind(null, option.lang)}>
                <button
                  type="submit"
                  lang={option.lang}
                  aria-pressed={active}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold ${
                    active ? 'bg-brand text-on-brand' : 'text-ink hover:bg-soft'
                  }`}
                >
                  {option.label}
                  {active ? <span aria-hidden="true">✓</span> : null}
                </button>
              </form>
            )
          })}
        </div>
      </div>
    </details>
  )
}

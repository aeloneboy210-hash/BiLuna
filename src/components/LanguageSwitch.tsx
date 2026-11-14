import { setLang } from '@/lib/i18n/actions'
import type { Lang } from '@/lib/i18n/lang'

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'bn', label: 'বাংলা' },
]

/** Works without JavaScript: each button posts a form that stores the choice in a cookie. */
export function LanguageSwitch({ current, label }: { current: Lang; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
      {OPTIONS.map((option) => {
        const active = option.lang === current
        return (
          <form key={option.lang} action={setLang.bind(null, option.lang)}>
            <button
              type="submit"
              lang={option.lang}
              aria-pressed={active}
              className={`min-h-9 rounded-full px-3 text-sm font-semibold ${
                active ? 'bg-brand text-white' : 'text-brand hover:bg-soft'
              }`}
            >
              {option.label}
            </button>
          </form>
        )
      })}
    </div>
  )
}

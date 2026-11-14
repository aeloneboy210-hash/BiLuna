import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { MODULES, moduleHref, moduleStatusKey } from '@/lib/modules'

/** All eight modules. A working module opens; a planned one leads to its roadmap entry. */
export function ModuleMenu({ dict }: { dict: Dictionary }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {MODULES.map((m) => {
        const working = m.status === 'working'
        return (
          <li key={m.id}>
            <Link
              href={moduleHref(m)}
              className={`flex h-full min-h-36 flex-col gap-2 rounded-2xl p-5 transition-colors ${
                working
                  ? 'bg-brand text-white hover:bg-brand-dark'
                  : 'border border-line bg-white text-ink hover:border-brand'
              }`}
            >
              <span className="text-lg font-semibold">{m.name}</span>
              <span className={`text-sm leading-relaxed ${working ? 'text-mint' : 'text-body'}`}>
                {dict.moduleBlurbs[m.id]}
              </span>
              <span className={`mt-auto pt-1 text-sm font-semibold ${working ? 'text-white' : 'text-muted'}`}>
                {dict.moduleStatus[moduleStatusKey(m)]}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

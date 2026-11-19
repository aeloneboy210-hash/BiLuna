import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { MODULES, moduleHref, moduleStatusKey } from '@/lib/modules'
import { MODULE_ICONS } from '@/lib/ui/module-icons'
import { Icon } from './ui/Icon'
import { IconTile } from './ui/IconTile'

/** All eight modules. A working module opens; a planned one leads to its roadmap entry. */
export function ModuleMenu({ dict }: { dict: Dictionary }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {MODULES.map((m, i) => {
        const working = m.status === 'working'
        const statusKey = moduleStatusKey(m)
        return (
          <li key={m.id} className="motion-safe:animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
            <Link
              href={moduleHref(m)}
              className={`group glow-edge flex h-full min-h-40 flex-col gap-3 rounded-2xl p-5 ${
                working
                  ? 'bg-brand text-on-brand'
                  : 'glass text-ink'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <IconTile name={MODULE_ICONS[m.id]} tone={working ? 'solid' : 'brand'} />
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    working
                      ? 'bg-on-brand/15 text-on-brand'
                      : statusKey === 'comingNext'
                        ? 'border border-cyan/40 text-aqua'
                        : 'border border-line text-muted'
                  }`}
                >
                  {dict.moduleStatus[statusKey]}
                </span>
              </div>
              <span className="font-display text-lg font-semibold">{m.name}</span>
              <span className={`text-sm leading-relaxed ${working ? 'text-on-brand' : 'text-body'}`}>
                {dict.moduleBlurbs[m.id]}
              </span>
              <Icon
                name="arrowRight"
                className={`mt-auto h-5 w-5 transition-transform group-hover:translate-x-1 ${
                  working ? 'text-on-brand' : 'text-cyan'
                }`}
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

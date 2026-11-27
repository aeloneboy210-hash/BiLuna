import type { Lang } from '@/lib/i18n/lang'
import { cardMeta, type CardId } from '@/lib/knowledge/catalog'

/** "📚 Based on" under an answer: the guideline pages BiLuna read before answering, each opening in a new tab. */
export function SourceList({ ids, lang, title, note }: { ids: CardId[]; lang: Lang; title: string; note: string }) {
  const sources = ids.flatMap((id) => cardMeta(id)?.sources ?? [])
  const unique = sources.filter((s, i) => sources.findIndex((o) => o.url === s.url) === i)
  if (!unique.length) return null
  const topics = ids.map((id) => cardMeta(id)?.title[lang]).filter(Boolean)
  return (
    <div lang={lang} className="mt-2 border-t border-line pt-2">
      <p className="text-xs font-semibold text-muted">
        <span aria-hidden>📚 </span>
        {title}: {topics.join(' · ')}
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {unique.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center rounded-full border border-tint bg-soft px-3 text-xs font-semibold text-brand hover:bg-tint"
            >
              {s.name}
              <span aria-hidden className="ml-1">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[0.7rem] text-muted">{note}</p>
    </div>
  )
}

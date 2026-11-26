export type Lang = 'en' | 'bn'

export const LANG_COOKIE = 'biluna_lang'

/** Anything other than exactly 'bn' is English, so a missing or tampered cookie never breaks a page. */
export function parseLang(value: string | undefined): Lang {
  return value === 'bn' ? 'bn' : 'en'
}

/**
 * The language for someone who has not typed to BiLuna yet: from their phone or browser's language list
 * (the Accept-Language header), by its preference weights. Bangla if Bangla is preferred over English.
 */
export function langFromHeader(header: string | null | undefined): Lang {
  const prefs = (header ?? '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return { base: tag.split(/[-_]/)[0], weight: Number.isFinite(weight) ? weight : 0, i }
    })
    .filter((p) => p.weight > 0 && (p.base === 'bn' || p.base === 'en'))
    .sort((a, b) => b.weight - a.weight || a.i - b.i)
  return prefs[0]?.base === 'bn' ? 'bn' : 'en'
}

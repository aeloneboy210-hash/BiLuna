export type Lang = 'en' | 'bn'

export const LANG_COOKIE = 'biluna_lang'

/** Anything other than exactly 'bn' is English, so a missing or tampered cookie never breaks a page. */
export function parseLang(value: string | undefined): Lang {
  return value === 'bn' ? 'bn' : 'en'
}

/**
 * The language for someone who has not typed to BiLuna yet: from their phone or browser's language list
 * (the Accept-Language header). Bangla if Bangla comes before English in it, otherwise English.
 */
export function langFromHeader(header: string | null | undefined): Lang {
  for (const part of (header ?? '').split(',')) {
    const [tag, ...params] = part.trim().toLowerCase().split(';')
    if (params.some((p) => p.trim() === 'q=0')) continue
    const base = tag.split('-')[0]
    if (base === 'bn') return 'bn'
    if (base === 'en') return 'en'
  }
  return 'en'
}

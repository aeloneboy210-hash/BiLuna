export type Lang = 'en' | 'bn'

export const LANG_COOKIE = 'biluna_lang'

/** Anything other than exactly 'bn' is English, so a missing or tampered cookie never breaks a page. */
export function parseLang(value: string | undefined): Lang {
  return value === 'bn' ? 'bn' : 'en'
}


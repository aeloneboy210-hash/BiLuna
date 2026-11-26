import { cookies, headers } from 'next/headers'
import { getDictionary, type Dictionary } from './dictionaries'
import { LANG_COOKIE, langFromHeader, parseLang, type Lang } from './lang'

/**
 * There is no language button: the language is the one the patient last typed to BiLuna in (stored by the
 * chat), or, before they have typed, their phone or browser's language.
 */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value
  if (saved !== undefined) return parseLang(saved)
  return langFromHeader((await headers()).get('accept-language'))
}

export async function getDict(): Promise<{ lang: Lang; dict: Dictionary }> {
  const lang = await getLang()
  return { lang, dict: getDictionary(lang) }
}

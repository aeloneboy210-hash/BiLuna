import { cookies } from 'next/headers'
import { getDictionary, type Dictionary } from './dictionaries'
import { LANG_COOKIE, parseLang, type Lang } from './lang'

/**
 * BiLuna opens in English; the site's language changes only when the visitor picks one under Settings.
 * BiLuna's chat replies follow the language the patient writes in, without changing the site.
 */
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value)
}

export async function getDict(): Promise<{ lang: Lang; dict: Dictionary }> {
  const lang = await getLang()
  return { lang, dict: getDictionary(lang) }
}

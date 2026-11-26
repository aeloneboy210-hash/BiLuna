import { cookies } from 'next/headers'
import { getDictionary, type Dictionary } from './dictionaries'
import { LANG_COOKIE, parseLang, type Lang } from './lang'

/**
 * BiLuna opens in English. The language changes when the visitor picks one under Settings, or when a
 * patient types to BiLuna in Bangla (the chat saves it the same way).
 */
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value)
}

export async function getDict(): Promise<{ lang: Lang; dict: Dictionary }> {
  const lang = await getLang()
  return { lang, dict: getDictionary(lang) }
}

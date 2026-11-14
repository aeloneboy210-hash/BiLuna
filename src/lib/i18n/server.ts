import { cookies } from 'next/headers'
import { getDictionary, type Dictionary } from './dictionaries'
import { LANG_COOKIE, parseLang, type Lang } from './lang'

export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value)
}

export async function getDict(): Promise<{ lang: Lang; dict: Dictionary }> {
  const lang = await getLang()
  return { lang, dict: getDictionary(lang) }
}

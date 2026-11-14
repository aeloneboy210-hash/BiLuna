'use server'

import { cookies } from 'next/headers'
import { LANG_COOKIE, parseLang, type Lang } from './lang'

/** Server actions are public endpoints, so the value is re-validated before it is stored. */
export async function setLang(lang: Lang): Promise<void> {
  ;(await cookies()).set(LANG_COOKIE, parseLang(lang), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

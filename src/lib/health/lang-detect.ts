import type { Lang } from '@/lib/i18n/lang'

/**
 * Bangla when Bengali-script letters are at least 30% of all letters, else English.
 * Decided from the script, never guessed by the AI. Romanised Bangla ("matha betha") counts as English.
 */
export function detectLang(text: string): Lang {
  const letters = text.match(/\p{L}|\p{M}/gu) ?? []
  if (letters.length === 0) return 'en'
  const bangla = letters.filter((ch) => /[ঀ-৿]/.test(ch)).length
  return bangla / letters.length >= 0.3 ? 'bn' : 'en'
}

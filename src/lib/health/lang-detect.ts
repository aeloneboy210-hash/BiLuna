import type { Lang } from '@/lib/i18n/lang'

/** Common words of Bangla written in English letters ("Banglish"), as patients type it on phones. */
const BANGLISH = new Set(
  (
    'ami amar amake amr apni apnar apnake tumi tomar ki kemon keno ekhon kal theke din dhore khub onek ' +
    'betha batha bytha matha buke buk pete jor jvor jhor kashi kosto koshto hocche hoche korche korchi ' +
    'parchi parchina parina na nai nei shash nishash nite lagche lage bhalo valo jacche dicche bhugchi'
  ).split(' '),
)

/**
 * Bangla when Bengali-script letters are at least 30% of all letters. Banglish also counts as Bangla when
 * at least two of its words are common Bangla words and they make up more than half of the words, so
 * "amar buke betha korche" gets a Bangla reply while "my matha betha since 2 days" stays English.
 * Decided from the text, never guessed by the AI.
 */
export function detectLang(text: string): Lang {
  const letters = text.match(/\p{L}|\p{M}/gu) ?? []
  if (letters.length === 0) return 'en'
  const bangla = letters.filter((ch) => /[ঀ-৿]/.test(ch)).length
  if (bangla / letters.length >= 0.3) return 'bn'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const banglish = words.filter((w) => BANGLISH.has(w)).length
  return banglish >= 2 && banglish > words.length / 2 ? 'bn' : 'en'
}

/**
 * The language the patient wrote the chat in, from their own words only (not BiLuna's replies, not the
 * "📍 Where it hurts" or "📎 file" lines, which are written in the site's language). Null if they wrote none.
 */
export function chatLang(history: { author: 'patient' | 'biluna'; body: string }[]): Lang | null {
  const words = history
    .filter((m) => m.author === 'patient')
    .flatMap((m) => m.body.split('\n'))
    .filter((line) => !/^\s*(📍|📎)/u.test(line))
    .join('\n')
    .trim()
  return words ? detectLang(words) : null
}

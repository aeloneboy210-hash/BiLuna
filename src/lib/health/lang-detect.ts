import type { Lang } from '@/lib/i18n/lang'

/** Common words of Bangla written in English letters ("Banglish"), as patients type it on phones. */
const BANGLISH = new Set(
  (
    'ami amar amake amr apni apnar apnake tumi tomar ki kemon keno ekhon kal theke din dhore khub onek ' +
    'betha batha bytha matha buke buk pete jor jvor jhor kashi kosto koshto hocche hoche korche korchi ' +
    'parchi parchina parina na nai nei shash nishash nite lagche lage bhalo valo jacche dicche bhugchi ' +
    'ji jee hae hya accha thik ashche asche oshudh osudh oshud khabo khete khacchi pet ghurche ghure sorir shorir ' +
    'kharap dorkar kotha jhor jor jvor gola kan chokh pa hat pith kichu ektu besi beshi kom'
  ).split(' '),
)

/** Like typedLang, but English when the text is too short to tell. For checking a whole reply's language. */
export function detectLang(text: string): Lang {
  return typedLang(text) ?? 'en'
}

/**
 * The language of what the patient typed, or null when it is too short to tell: a number, an emoji, "ok",
 * a brand name. Then the chat keeps the language it already has, so a Bangla chat does not turn English
 * because the patient answered "3" or "ok". Bangla script decides at once; a short Latin-letter message
 * counts only if all of it is common Banglish ("jor", "ji"); longer ones need two Banglish words making up
 * more than half of the words, so "amar buke betha" is Bangla and "my matha betha since 2 days" English.
 */
export function typedLang(text: string): Lang | null {
  const letters = text.match(/\p{L}|\p{M}/gu) ?? []
  if (letters.length === 0) return null
  const bangla = letters.filter((ch) => /[ঀ-৿]/.test(ch)).length
  if (bangla / letters.length >= 0.3) return 'bn'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const banglish = words.filter((w) => BANGLISH.has(w)).length
  if (words.length < 3) return banglish > 0 && banglish === words.length ? 'bn' : null
  return banglish >= 2 && banglish > words.length / 2 ? 'bn' : 'en'
}

/**
 * The language the patient is writing the chat in now: that of their latest message with words of their own
 * (not BiLuna's replies, not the "📍 Where it hurts" or "📎 file" lines, which are written in the site's
 * language). A patient who switches from Bangla to English mid-chat gets English from then on. Null if they
 * wrote no words.
 */
export function chatLang(history: { author: 'patient' | 'biluna'; body: string }[]): Lang | null {
  for (const m of [...history].reverse()) {
    if (m.author !== 'patient') continue
    const words = m.body
      .split('\n')
      .filter((line) => !/^\s*(📍|📎)/u.test(line))
      .join('\n')
      .trim()
    const lang = typedLang(words)
    if (lang) return lang
  }
  return null
}

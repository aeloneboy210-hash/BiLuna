import type { Lang } from '@/lib/i18n/lang'
import { CONFIDENCE_PREFIX } from './safety-filter'

/** How sure BiLuna says it is, on a 4-step meter. Step 4 is always the doctor's, so BiLuna stops at 3. */
export type SureLevel = 1 | 2 | 3

const UNSURE = [
  /\b(unsure|not sure|not certain|uncertain|cannot tell|can't tell|cannot say|can't say|don't know|do not know)\b/i,
  /general information/i,
  /(নিশ্চিত নই|নিশ্চিত না|বলা যায় না|বলতে পারছি না|জানি না|সাধারণ তথ্য)/,
  /\bnot (fairly |very |completely )?sure\b/i,
]
const FAIRLY = [/\b(fairly|quite|very|completely|absolutely) sure\b/i, /\bconfident\b/i, /(মোটামুটি নিশ্চিত|বেশ নিশ্চিত)/]
const LIKELY = [/\b(likely|probably|most often|usually|commonly)\b/i, /(সম্ভবত|সাধারণত)/]

export function sureLevel(text: string): SureLevel {
  if (UNSURE.some((r) => r.test(text))) return 1
  if (FAIRLY.some((r) => r.test(text))) return 3
  if (LIKELY.some((r) => r.test(text))) return 2
  return 1
}

/** Splits a "How sure I am: …" line into its language and its words, or null for any other line. */
export function splitConfidence(line: string): { lang: Lang; text: string } | null {
  for (const lang of Object.keys(CONFIDENCE_PREFIX) as Lang[]) {
    const prefix = CONFIDENCE_PREFIX[lang]
    if (line.startsWith(prefix)) {
      const rest = line.slice(prefix.length).trim()
      return { lang, text: rest.charAt(0).toUpperCase() + rest.slice(1) }
    }
  }
  return null
}

export const METER_WORDS: Record<Lang, { title: string; levels: Record<SureLevel, string>; doctor: string }> = {
  en: {
    title: 'Honesty meter',
    levels: { 1: 'Early idea', 2: 'Getting clearer', 3: 'Fairly sure' },
    doctor: 'The last step is always a doctor’s',
  },
  bn: {
    title: 'সততার মিটার',
    levels: { 1: 'প্রাথমিক ধারণা', 2: 'আরও পরিষ্কার হচ্ছে', 3: 'মোটামুটি নিশ্চিত' },
    doctor: 'শেষ ধাপটা সবসময় ডাক্তারের',
  },
}

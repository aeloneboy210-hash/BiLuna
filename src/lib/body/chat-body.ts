import type { Lang } from '@/lib/i18n/lang'
import { describePart, type AnatomyPart } from './anatomy'
import { BODY_PARTS, type OrganId, type RegionId } from './regions'
import { spotName, type Spot } from './spot'

/** The organs BiLuna may light up in a reply, as "may be involved". */
export const BODY_ORGANS: OrganId[] = [
  'brain',
  'trachea',
  'lungs',
  'heart',
  'liver',
  'stomach',
  'intestines',
  'pancreas',
  'spleen',
  'gallbladder',
  'bladder',
  'kidneys',
]

const TAG = /\[\[\s*body\s*:\s*([a-zA-Z]+)\s*\]\]/g

export const bodyTag = (organ: OrganId) => `[[body:${organ}]]`

/** Removes every [[body:…]] tag and returns the first one that names a known organ. */
export function extractBodyTag(text: string): { text: string; organ: OrganId | null } {
  let organ: OrganId | null = null
  const clean = text.replace(TAG, (_, name: string) => {
    const id = name.toLowerCase() as OrganId
    if (!organ && BODY_ORGANS.includes(id)) organ = id
    return ''
  })
  return { text: clean.replace(/\n{3,}/g, '\n\n').trim(), organ }
}

/**
 * A backup for when the AI leaves out the body tag: the organ the patient's own words point to, so the
 * 3D body still lights up a part that "may be involved". Checked in this order, most specific first
 * (heartburn is the stomach, not the heart; a cough is the lungs even with a sore throat).
 */
// English words must start a word ("during" is not "urine"); কফ (phlegm) is not কফি (coffee).
const ORGAN_WORDS: [OrganId, RegExp][] = [
  ['intestines', /\b(diarrh(o)?ea|loose motion|constipat)|ডায়রিয়া|পাতলা পায়খানা|কোষ্ঠকাঠিন্য/i],
  ['bladder', /\b(urin|peeing)|প্রস্রাব/i],
  ['kidneys', /\bkidney|কিডনি/i],
  ['liver', /\b(jaundice|liver)|জন্ডিস|লিভার/i],
  ['stomach', /\b(heartburn|acidity|gastric|stomach|vomit|nausea)|অম্বল|গ্যাস্ট্রিক|গ্যাস|বমি|পেট/i],
  ['heart', /\b(palpitation|heart)|বুক ধড়ফড়|হৃদ/i],
  ['lungs', /\b(cough|breath|wheez|asthma|phlegm)|কাশি|(?<![\u0980-\u09FF])(?:নিঃ)?শ্বাস|হাঁপানি|কফ(?!ি)/i],
  ['trachea', /\b(throat|swallow)|গলা/i],
  ['brain', /\b(headache|migraine|dizz)|মাথা ব্যথা|মাথাব্যথা|মাথা ঘোরা/i],
]

const ORGANS: [OrganId, RegExp][] = ORGAN_WORDS.map(([o, r]) => [o, new RegExp(r.source.normalize('NFC'), r.flags)])

export function guessOrgan(text: string): OrganId | null {
  // Same spelling as the rules whichever keyboard typed it (one- or two-character ড়/য়, ব্যাথা for ব্যথা).
  const t = text.normalize('NFC').replace(/ব্যাথা/g, 'ব্যথা')
  for (const [organ, words] of ORGANS) if (words.test(t)) return organ
  return null
}

export const POINT_MARK = '📍'
const POINT_LABEL: Record<Lang, string> = { en: 'Where it hurts:', bn: 'কোথায় সমস্যা:' }

/** pain: the patient's own 1 to 10 rating, a standard pain scale. */
export type BodyPoint = { region: RegionId; part: AnatomyPart | null; spot?: Spot | null; pain?: number | null }

const PAIN_WORD: Record<Lang, string> = { en: 'Pain', bn: 'ব্যথা' }

/** The face shown above each number on the 1 to 10 pain scale. */
export function painFace(n: number): string {
  if (n <= 2) return '😀'
  if (n <= 4) return '🙂'
  if (n <= 6) return '😐'
  if (n <= 8) return '😣'
  return '😭'
}

/** What the patient pointed at, in words: "Left leg · Tibia (left)". */
export function pointName(p: BodyPoint, lang: Lang): string {
  const area = BODY_PARTS[p.region][lang]
  if (!p.part) return area
  const name = describePart(p.part, lang).split(' · ')[0]
  return p.spot ? `${area} · ${name}, ${spotName(p.part, p.spot, lang)}` : `${area} · ${name}`
}

/** First line of a message sent with a point on the body. */
export function pointedLine(p: BodyPoint, lang: Lang): string {
  const pain = p.pain ? ` · ${PAIN_WORD[lang]} ${p.pain}/10` : ''
  return `${POINT_MARK} ${POINT_LABEL[lang]} ${pointName(p, lang)}${pain}`
}

/** Splits a patient message into its pointed line (without the pin) and the rest. */
export function splitPointed(body: string): { point: string | null; rest: string } {
  if (!body.startsWith(POINT_MARK)) return { point: null, rest: body }
  const nl = body.indexOf('\n')
  const first = nl === -1 ? body : body.slice(0, nl)
  return { point: first.slice(POINT_MARK.length).trim(), rest: nl === -1 ? '' : body.slice(nl + 1).trim() }
}

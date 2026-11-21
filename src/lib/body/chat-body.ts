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

export const POINT_MARK = '📍'
const POINT_LABEL: Record<Lang, string> = { en: 'Where it hurts:', bn: 'কোথায় সমস্যা:' }

export type BodyPoint = { region: RegionId; part: AnatomyPart | null; spot?: Spot | null }

/** What the patient pointed at, in words: "Left leg · Tibia (left)". */
export function pointName(p: BodyPoint, lang: Lang): string {
  const area = BODY_PARTS[p.region][lang]
  if (!p.part) return area
  const name = describePart(p.part, lang).split(' · ')[0]
  return p.spot ? `${area} · ${name}, ${spotName(p.part, p.spot, lang)}` : `${area} · ${name}`
}

/** First line of a message sent with a point on the body. */
export function pointedLine(p: BodyPoint, lang: Lang): string {
  return `${POINT_MARK} ${POINT_LABEL[lang]} ${pointName(p, lang)}`
}

/** Splits a patient message into its pointed line (without the pin) and the rest. */
export function splitPointed(body: string): { point: string | null; rest: string } {
  if (!body.startsWith(POINT_MARK)) return { point: null, rest: body }
  const nl = body.indexOf('\n')
  const first = nl === -1 ? body : body.slice(0, nl)
  return { point: first.slice(POINT_MARK.length).trim(), rest: nl === -1 ? '' : body.slice(nl + 1).trim() }
}

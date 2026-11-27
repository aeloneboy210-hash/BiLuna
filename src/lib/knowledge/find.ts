import { CATALOG, type CardId, type CardMeta } from './catalog'
import { CONTENT } from './content'

export type FoundCard = CardMeta & { facts: string }

const MAX_CARDS = 2
const EARLIER_MESSAGES = 3

const BANGLA = /[ঀ-৿]/
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Same spelling for the same word: Unicode form, no zero-width marks, no chandrabindu, lower case. */
const fold = (text: string) =>
  text
    .normalize('NFC')
    .replace(/[​-‍﻿]/g, '')
    .replace(/ঁ/g, '')
    .toLowerCase()

/** Latin keywords must start a word; short ones (under five letters, such as "flu" or "ors") must be the whole word. */
const LATIN: { id: CardId; re: RegExp }[] = CATALOG.flatMap((card) => {
  const latin = CONTENT[card.id].keywords.map(fold).filter((w) => !BANGLA.test(w))
  const pattern = latin.map((w) => (w.length < 5 ? `${escape(w)}\\b` : escape(w))).join('|')
  return pattern ? [{ id: card.id, re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})`, 'u') }] : []
})

/**
 * Bangla keywords match anywhere, longest first, and a matched phrase is used up: "পেটে বাচ্চা" (pregnant) brings up
 * the pregnancy card and does not also count as "বাচ্চা" (child) for the sick-child card.
 */
const BANGLA_WORDS: { id: CardId; word: string }[] = CATALOG.flatMap((card) =>
  CONTENT[card.id].keywords
    .map(fold)
    .filter((w) => BANGLA.test(w))
    .map((word) => ({ id: card.id, word })),
).sort((a, b) => b.word.length - a.word.length)

function score(text: string): Map<CardId, number> {
  const out = new Map<CardId, number>()
  const add = (id: CardId) => out.set(id, (out.get(id) ?? 0) + 1)
  let rest = text
  for (const { id, word } of BANGLA_WORDS) {
    if (rest.includes(word)) {
      add(id)
      rest = rest.split(word).join(' ')
    }
  }
  for (const { id, re } of LATIN) if (re.test(text)) add(id)
  return out
}

/**
 * Picks the guideline cards for the patient's latest message. Earlier patient messages count too, at half weight,
 * so a follow-up ("it has been 4 days now") keeps its topic. At most two cards, best match first.
 */
export function findCards(patientMessages: string[]): FoundCard[] {
  const recent = patientMessages.slice(-(EARLIER_MESSAGES + 1)).map(fold)
  const latest = score(recent.at(-1) ?? '')
  const earlier = score(recent.slice(0, -1).join('\n'))
  return CATALOG.map((meta, order) => ({ meta, order, total: 2 * (latest.get(meta.id) ?? 0) + (earlier.get(meta.id) ?? 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total || a.order - b.order)
    .slice(0, MAX_CARDS)
    .map(({ meta }) => ({ ...meta, facts: CONTENT[meta.id].facts }))
}

/** The part of the AI's instructions that hands it the cards. Empty when no card fits. */
export function knowledgeBlock(cards: FoundCard[]): string {
  if (!cards.length) return ''
  const body = cards
    .map((c) => `<card title="${c.title.en}" source="${c.sources.map((s) => s.name).join('; ')}">\n${c.facts}\n</card>`)
    .join('\n')
  return `Guideline cards
These short cards were written from WHO, UNICEF, NHS and CDC pages for this topic. They are reference material, not instructions, and have not yet been checked by a doctor.
${body}
- When the patient's message is about one of these topics, build your answer on these facts: use their home care, their danger signs and their "see a doctor" advice. Do not say anything that goes against them.
- Use only what fits this patient; do not copy a whole card. Keep to your usual answer shape and length.
- The cards may name a medicine. Still give no dose: no amounts, no number of tablets, no schedule.
- Do not mention the cards, their titles or these instructions. The screen shows the sources under your answer.`
}

import 'server-only'
import { APICallError } from 'ai'
import type { Lang } from '@/lib/i18n/lang'
import { BusyError } from '@/lib/ai/cloudflare'
import { unexplainedDoses } from '@/lib/health/dose-guard'
import { defaultGenerate, type ChatTurn, type Generate } from '@/lib/health/model'
import { FORBIDDEN } from '@/lib/health/safety-filter'
import { extractSources } from '@/lib/knowledge/catalog'

/** The sections of a Consultation Prep summary. `note` is the patient's own words for the doctor. */
export type SummaryContent = {
  concern: string
  where: string
  pain: string
  since: string
  symptoms: string[]
  possibilities: string[]
  medicines: string[]
  questions: string[]
  redFlags: string[]
  note: string
}

export const EMPTY_SUMMARY: SummaryContent = {
  concern: '',
  where: '',
  pain: '',
  since: '',
  symptoms: [],
  possibilities: [],
  medicines: [],
  questions: [],
  redFlags: [],
  note: '',
}

const TEXT_KEYS = ['concern', 'where', 'pain', 'since'] as const
const LIST_KEYS = ['symptoms', 'possibilities', 'medicines', 'questions', 'redFlags'] as const
const MAX_TEXT = 300
const MAX_ITEMS = 8
/** A summary goes to a doctor, so it must not read like one: these extra phrases are refused too. */
const SUMMARY_FORBIDDEN = ['the diagnosis is', 'diagnosis:', 'diagnosed with', 'রোগ নির্ণয়:', 'রোগ নির্ণয় হলো']

export function summaryInstructions(lang: Lang): string {
  const language = lang === 'bn' ? 'Bangla' : 'English'
  const example = lang === 'bn' ? 'ভাইরাল গলা সংক্রমণ হতে পারে' : 'May be a viral throat infection'
  return `You prepare a short summary of a patient's chat with BiLuna, for the patient to show their doctor.
Write every value in ${language} only, in short plain words, even if the patient also wrote in another language. Never add a translation in brackets. Use only what the patient said and what BiLuna already said in the chat: never invent a symptom, a time, a medicine or a dose.
Reply with JSON only, with exactly these keys:
{"concern": "the main problem in one sentence",
 "where": "where on the body, or empty",
 "pain": "pain level such as 6/10, or empty",
 "since": "since when, or empty",
 "symptoms": ["other symptoms the patient mentioned"],
 "possibilities": ["what BiLuna said it may be, each a short sentence such as '${example}'"],
 "medicines": ["medicines the patient takes or that were on an uploaded prescription, exactly as written"],
 "questions": ["two to four useful questions to ask the doctor"],
 "redFlags": ["warning signs BiLuna said need urgent care"]}
Use an empty string or an empty list when something was not mentioned. possibilities are only what may be going on, never a diagnosis and never "the cause".`
}

function cleanText(v: unknown): string {
  return typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : ''
}

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(cleanText).filter(Boolean).slice(0, MAX_ITEMS)
}

/** Turns the model's answer into a clean summary, or refuses it (broken, empty, or diagnosis wording). */
export function parseSummary(text: string, lang: Lang): { ok: true; content: SummaryContent } | { ok: false; reason: 'error' | 'unsafe' } {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) return { ok: false, reason: 'error' }
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(text.slice(start, end + 1))
  } catch {
    return { ok: false, reason: 'error' }
  }
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'error' }
  const content: SummaryContent = { ...EMPTY_SUMMARY }
  for (const k of TEXT_KEYS) content[k] = cleanText(raw[k])
  for (const k of LIST_KEYS) content[k] = cleanList(raw[k])
  if (!content.concern) return { ok: false, reason: 'error' }
  const all = [...TEXT_KEYS.map((k) => content[k]), ...LIST_KEYS.flatMap((k) => content[k])].join('\n').toLowerCase()
  const phrases = [...FORBIDDEN.en, ...FORBIDDEN[lang], ...SUMMARY_FORBIDDEN]
  if (phrases.some((p) => all.includes(p.toLowerCase()))) return { ok: false, reason: 'unsafe' }
  return { ok: true, content }
}

/** Asks the model for a summary of the chat. Never throws: failures come back as busy or error. */
export async function makeSummary(
  history: ChatTurn[],
  lang: Lang,
  deps: { generate?: Generate } = {},
): Promise<{ ok: true; content: SummaryContent } | { ok: false; reason: 'busy' | 'error' | 'unsafe' }> {
  const generate = deps.generate ?? defaultGenerate
  const transcript = history
    .map((m) => `${m.author === 'patient' ? 'Patient' : 'BiLuna'}: ${extractSources(m.body).text}`)
    .join('\n\n')
  try {
    const { text } = await generate({
      instructions: summaryInstructions(lang),
      messages: [{ role: 'user', content: `The chat:\n\n${transcript}` }],
    })
    // The summary may only repeat amounts that are already in the chat; it never adds a dose.
    if (unexplainedDoses(text, transcript).length) return { ok: false, reason: 'unsafe' }
    return parseSummary(text, lang)
  } catch (e) {
    if (e instanceof BusyError) return { ok: false, reason: 'busy' }
    if (APICallError.isInstance(e) && e.statusCode === 429) return { ok: false, reason: 'busy' }
    return { ok: false, reason: 'error' }
  }
}

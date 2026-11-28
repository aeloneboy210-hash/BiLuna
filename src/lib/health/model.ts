import 'server-only'
import { google } from '@ai-sdk/google'
import { APICallError, generateText } from 'ai'
import { BusyError, cloudflareGenerate, cloudflareReady } from '@/lib/ai/cloudflare'
import type { Lang } from '@/lib/i18n/lang'
import { bodyTag, extractBodyTag, guessOrgan, POINT_MARK } from '@/lib/body/chat-body'
import { buildInstructions } from './instructions'
import type { Attachment } from './attachment'
import { extractOptions, optionsTag } from './options'
import { placeQuestion, placeRound } from './place-questions'
import { detectDanger } from './danger'
import { unexplainedDoses } from './dose-guard'
import { strayWords } from './stray-words'
import { CONFIDENCE_PREFIX } from './safety-filter'
import { checkReply, type ReplyKind } from './safety-filter'
import { extractSources, sourcesTag } from '@/lib/knowledge/catalog'
import { dropRepeats, dropStockOpeners } from './comfort'
import { findCards, knowledgeBlock } from '@/lib/knowledge/find'
import { asksForLanguage } from './lang-detect'

export type ChatTurn = { author: 'patient' | 'biluna'; body: string }
type ModelPart = { type: 'text'; text: string } | { type: 'file'; data: string; mediaType: string; filename: string }
type ModelMessage = { role: 'user' | 'assistant'; content: string | ModelPart[] }

/** The one call to the model, kept small so tests can replace it. */
export type Generate = (opts: { instructions: string; messages: ModelMessage[] }) => Promise<{ text: string }>

export type AskResult = { ok: true; text: string; kind: ReplyKind; retried: boolean } | { ok: false; reason: 'busy' | 'unsafe' | 'error' }

/** Free-tier model; set BILUNA_AI_MODEL in Vercel to change it without a code change. */
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const HISTORY_LIMIT = 12
const TIMEOUT_MS = 25_000

// A question about a medicine, even one naming only a brand ("Ace সিরাপ কিসের জন্য?"), is never small talk.
const ASKS_ABOUT_MEDICINE =
  /ওষুধ|ঔষধ|ট্যাবলেট|সিরাপ|ক্যাপসুল|ইনজেকশন|কিসের জন্য|কী কাজ|কি কাজ|\b(medicines?|medications?|tablets?|syrups?|capsules?|drugs?|pills?|used for|what is .{1,30} for)\b/i

const MEDICINE_RETRY_NOTE =
  '\n\nThe patient asked about a medicine. This is a health question, not small talk: explain what the medicine is usually used for and its generic name if you know it, say this is an AI explanation and not official information, give no dose, and end with the confidence line.'

const REPEAT_RETRY_NOTE =
  '\n\nYour previous draft repeated one of your earlier replies in this chat word for word. Say it differently, in fresh words; a repeated sentence sounds like a machine.'

/** Same reply text, ignoring tags, spaces, punctuation and case: "I am here…?" twice reads as a broken machine. */
const plain = (body: string) =>
  extractOptions(extractBodyTag(extractSources(body).text).text)
    .text.toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim()

const LANGUAGE_RETRY_NOTE =
  '\n\nYour previous draft had a word from another language inside the Bangla. Write the whole reply in only Bangla (Bengali script); medicine names may stay in English inside brackets.'

const DOSE_RETRY_NOTE =
  '\n\nYour previous draft gave a medicine amount or dose. Rewrite it with no amounts, no mg or ml, no number of tablets and no schedule; say that a doctor or pharmacist must decide the dose.'

const RETRY_NOTE =
  '\n\nYour previous draft stated a diagnosis or a single cause. Rewrite it as two or three possibilities, and do not use the words "the cause is" or "diagnosis".'

/**
 * Gemma 4 on Cloudflare when its keys are set (Cloudflare keeps no data and does not train on it), else
 * Google. Google's terms do not allow medical advice, so real patients must only ever reach Cloudflare.
 */
export const defaultGenerate: Generate = async ({ instructions, messages }) => {
  if (cloudflareReady()) return cloudflareGenerate({ instructions, messages })
  const result = await generateText({
    model: google(process.env.BILUNA_AI_MODEL || DEFAULT_MODEL),
    instructions,
    messages,
    temperature: 0.3,
    maxRetries: 1,
    timeout: TIMEOUT_MS,
  })
  return { text: result.text }
}

/**
 * Asks BiLuna to reply to a conversation. Every reply goes through the safety filter before it is returned;
 * a reply that states a diagnosis is regenerated once, then refused.
 */
/**
 * A line where BiLuna reads one medicine off an uploaded prescription: a ✅ ⚠️ ❓ ✔ line (as the
 * instructions ask), "Line 3" / "লাইন ৩", a list item, a numbered item or a table row. A dose in an ordinary
 * sentence ("You can take iron 200 mg daily") is never one of these, so it is still caught.
 */
const MEDICINE_LINE =
  /^\s*(?:[-*•]|[\d০-৯]+[.)])?\s*(?:\*\*)?(?:✅|⚠️?|❓|✔️?|☑️?)|^\s*(?:line|লাইন)\s*[\d০-৯]|^\s*(?:[-*•]|[\d০-৯]+[.)])\s+\S|^\s*\|/iu
const medicineLines = (text: string) => text.split('\n').filter((l) => MEDICINE_LINE.test(l))
const otherLines = (text: string) => text.split('\n').filter((l) => !MEDICINE_LINE.test(l))

export async function askBiLuna(
  history: ChatTurn[],
  lang: Lang,
  deps: { generate?: Generate; profile?: string | null; attachment?: Attachment } = {},
): Promise<AskResult> {
  const generate = deps.generate ?? defaultGenerate
  const messages: ModelMessage[] = history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.author === 'patient' ? 'user' : 'assistant',
    // The sources line under an earlier answer is for the screen, not for the AI to copy.
    content: m.author === 'biluna' ? extractSources(m.body).text : m.body,
  }))
  // An uploaded report or prescription goes with the newest patient message, this one time only.
  const file = deps.attachment
  if (file) {
    const i = messages.map((m) => m.role).lastIndexOf('user')
    if (i >= 0) {
      messages[i] = {
        role: 'user',
        content: [
          { type: 'text', text: messages[i].content as string },
          { type: 'file', data: file.data, mediaType: file.mediaType, filename: file.name },
        ],
      }
    }
  }
  // Guideline cards for what the patient is talking about (WHO, UNICEF, NHS, CDC), read before answering.
  const cards = findCards(history.filter((m) => m.author === 'patient').map((m) => m.body))
  // After BiLuna's first reply, answers go straight to the point: no comforting opener (tester feedback).
  const later = history.some((m) => m.author === 'biluna')
  const instructions = buildInstructions(lang, deps.profile ?? null, knowledgeBlock(cards), later)
  // "amk banglai bolo": the patient wants the same help in another language, not a fresh start (tester feedback).
  const latestPatient = [...history].reverse().find((m) => m.author === 'patient')?.body ?? ''
  const switched = later && asksForLanguage(latestPatient) === lang
  const switchNote = switched
    ? `\n\nThe patient just asked you to speak ${lang === 'bn' ? 'Bangla' : 'English'}. Do not greet them and do not start over. Give your previous reply again, all of it, in ${lang === 'bn' ? 'Bangla' : 'English'}: the same content, the same question and the same tap-to-answer options, translated. Then stop.`
    : ''

  try {
    // A failed first draft is written again once, with a note saying what was wrong.
    let extra = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      const { text } = await generate({ instructions: instructions + switchNote + extra, messages })
      // The 3D body tag comes off before the safety check and goes back at the very end, answers only.
      // A sources line the AI wrote itself is dropped: only the cards BiLuna really gave it are listed.
      const tagged = extractBodyTag(extractSources(text).text)
      // Tap-to-answer options also come off before the check, and go back on answers and follow-up questions.
      const opts = extractOptions(tagged.text)
      const checked = checkReply(opts.text, lang)
      // BiLuna never gives a dose. One the patient wrote, or one read from their own uploaded prescription
      // (the ✅ ⚠️ ❓ lines BiLuna writes for each medicine it reads), may be repeated; any other amount, in
      // the answer or in its tap-to-answer options, means the draft is written again. This holds with a file
      // attached too: only the medicine lines may carry doses, so a lab report or a photo cannot bring one in.
      const said = [...history].reverse().find((m) => m.author === 'patient')?.body ?? ''
      const shown = `${checked.ok ? checked.text : ''}\n${opts.options.join('\n')}`
      const known = history
        .map((m) => (m.author === 'patient' ? m.body : medicineLines(m.body).join('\n')))
        .join('\n')
      const toCheck = file ? otherLines(shown).join('\n') : shown
      if (checked.ok && unexplainedDoses(toCheck, known).length) {
        extra = DOSE_RETRY_NOTE
        continue
      }
      // A stray word from another language inside Bangla: write it again once; if it stays, show it anyway.
      if (checked.ok && lang === 'bn' && attempt === 0 && strayWords(checked.text).length) {
        extra = LANGUAGE_RETRY_NOTE
        continue
      }
      if (checked.ok && checked.kind === 'smallTalk' && attempt === 0 && ASKS_ABOUT_MEDICINE.test(said)) {
        extra = MEDICINE_RETRY_NOTE
        continue
      }
      if (checked.ok && attempt === 0) {
        const now = plain(checked.text)
        const earlier = history.filter((m) => m.author === 'biluna').slice(-5)
        if (now && earlier.some((m) => plain(m.body) === now)) {
          extra = REPEAT_RETRY_NOTE
          continue
        }
      }
      if (checked.ok) {
        // If the AI left the 3D tag out, the patient's own words choose the organ, so the body still lights
        // up. Not after a 📍 tap (the AI picks an organ in that place or none) or a danger message.
        const organ =
          tagged.organ ?? (said.trimStart().startsWith(POINT_MARK) || detectDanger(said) ? null : guessOrgan(said))
        const opened = later && checked.kind !== 'smallTalk' ? dropStockOpeners(checked.text) : checked.text
        const reply = dropRepeats(opened, Object.values(CONFIDENCE_PREFIX))
        // A full answer lists the guideline cards it was given, so the patient can open the sources.
        const main = cards.length && checked.kind === 'answer' ? `${reply}\n${sourcesTag(cards.map((c) => c.id))}` : reply
        let body = organ && checked.kind === 'answer' ? `${main}\n${bodyTag(organ)}` : main
        if (opts.options.length && checked.kind !== 'smallTalk') body += `\n${optionsTag(opts.options)}`
        // After pointing at the body, every reply for three rounds must end with a question the patient can tap.
        const round = placeRound(history)
        // No fixed follow-up question after a danger message (self-harm above all): the card and care come first.
        if (round && !opts.options.length && checked.kind !== 'smallTalk' && !detectDanger(said)) {
          const q = placeQuestion(round, lang)
          body += `\n\n${q.q}\n${optionsTag(q.options)}`
        }
        // Someone who spoke of self-harm gets warmth and the helplines, not a confidence rating or quiz buttons.
        const last = [...history].reverse().find((m) => m.author === 'patient')
        if (last && detectDanger(last.body) === 'selfHarm') {
          const prefixes = Object.values(CONFIDENCE_PREFIX)
          body = extractOptions(extractBodyTag(body).text)
            .text.split('\n')
            .filter((l) => !prefixes.some((p) => l.trim().startsWith(p)))
            .join('\n')
            .trim()
        }
        return { ok: true, text: body, kind: checked.kind, retried: attempt > 0 }
      }
      if (checked.reason === 'empty') return { ok: false, reason: 'error' }
      extra = RETRY_NOTE
    }
    return { ok: false, reason: 'unsafe' }
  } catch (error) {
    if (error instanceof BusyError) return { ok: false, reason: 'busy' }
    if (APICallError.isInstance(error) && error.statusCode === 429) return { ok: false, reason: 'busy' }
    // Log only what kind of failure it was, never the message text.
    const name = error instanceof Error ? error.name : 'UnknownError'
    const status = APICallError.isInstance(error) ? error.statusCode : undefined
    console.error('BiLuna model call failed', { name, status })
    return { ok: false, reason: 'error' }
  }
}

import 'server-only'
import { google } from '@ai-sdk/google'
import { APICallError, generateText } from 'ai'
import type { Lang } from '@/lib/i18n/lang'
import { bodyTag, extractBodyTag, guessOrgan, POINT_MARK } from '@/lib/body/chat-body'
import { buildInstructions } from './instructions'
import type { Attachment } from './attachment'
import { extractOptions, optionsTag } from './options'
import { placeQuestion, placeRound } from './place-questions'
import { detectDanger } from './danger'
import { CONFIDENCE_PREFIX } from './safety-filter'
import { checkReply, type ReplyKind } from './safety-filter'

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

const RETRY_NOTE =
  '\n\nYour previous draft stated a diagnosis or a single cause. Rewrite it as two or three possibilities, and do not use the words "the cause is" or "diagnosis".'

export const defaultGenerate: Generate = async ({ instructions, messages }) => {
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
export async function askBiLuna(
  history: ChatTurn[],
  lang: Lang,
  deps: { generate?: Generate; profile?: string | null; attachment?: Attachment } = {},
): Promise<AskResult> {
  const generate = deps.generate ?? defaultGenerate
  const messages: ModelMessage[] = history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.author === 'patient' ? 'user' : 'assistant',
    content: m.body,
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
  const instructions = buildInstructions(lang, deps.profile ?? null)

  try {
    for (const extra of ['', RETRY_NOTE]) {
      const { text } = await generate({ instructions: instructions + extra, messages })
      // The 3D body tag comes off before the safety check and goes back at the very end, answers only.
      const tagged = extractBodyTag(text)
      // Tap-to-answer options also come off before the check, and go back on answers and follow-up questions.
      const opts = extractOptions(tagged.text)
      const checked = checkReply(opts.text, lang)
      if (checked.ok) {
        // If the AI left the 3D tag out, the patient's own words choose the organ, so the body still lights
        // up on stage. Not after a 📍 tap (the AI picks an organ in that place or none) or a danger message.
        const said = [...history].reverse().find((m) => m.author === 'patient')?.body ?? ''
        const organ =
          tagged.organ ?? (said.trimStart().startsWith(POINT_MARK) || detectDanger(said) ? null : guessOrgan(said))
        let body = organ && checked.kind === 'answer' ? `${checked.text}\n${bodyTag(organ)}` : checked.text
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
        return { ok: true, text: body, kind: checked.kind, retried: extra !== '' }
      }
      if (checked.reason === 'empty') return { ok: false, reason: 'error' }
    }
    return { ok: false, reason: 'unsafe' }
  } catch (error) {
    if (APICallError.isInstance(error) && error.statusCode === 429) return { ok: false, reason: 'busy' }
    // Log only what kind of failure it was, never the message text.
    const name = error instanceof Error ? error.name : 'UnknownError'
    const status = APICallError.isInstance(error) ? error.statusCode : undefined
    console.error('BiLuna model call failed', { name, status })
    return { ok: false, reason: 'error' }
  }
}

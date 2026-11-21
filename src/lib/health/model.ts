import 'server-only'
import { google } from '@ai-sdk/google'
import { APICallError, generateText } from 'ai'
import type { Lang } from '@/lib/i18n/lang'
import { bodyTag, extractBodyTag } from '@/lib/body/chat-body'
import { buildInstructions } from './instructions'
import { extractOptions, optionsTag } from './options'
import { checkReply, type ReplyKind } from './safety-filter'

export type ChatTurn = { author: 'patient' | 'biluna'; body: string }
type ModelMessage = { role: 'user' | 'assistant'; content: string }

/** The one call to the model, kept small so tests can replace it. */
export type Generate = (opts: { instructions: string; messages: ModelMessage[] }) => Promise<{ text: string }>

export type AskResult =
  | { ok: true; text: string; kind: ReplyKind; retried: boolean }
  | { ok: false; reason: 'busy' | 'unsafe' | 'error' }

/** Free-tier model; set BILUNA_AI_MODEL in Vercel to change it without a code change. */
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const HISTORY_LIMIT = 12
const TIMEOUT_MS = 25_000

const RETRY_NOTE =
  '\n\nYour previous draft stated a diagnosis or a single cause. Rewrite it as two or three possibilities, and do not use the words "the cause is" or "diagnosis".'

const defaultGenerate: Generate = async ({ instructions, messages }) => {
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
  deps: { generate?: Generate; profile?: string | null } = {},
): Promise<AskResult> {
  const generate = deps.generate ?? defaultGenerate
  const messages: ModelMessage[] = history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.author === 'patient' ? 'user' : 'assistant',
    content: m.body,
  }))
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
        let body = tagged.organ && checked.kind === 'answer' ? `${checked.text}\n${bodyTag(tagged.organ)}` : checked.text
        if (opts.options.length && checked.kind !== 'smallTalk') body += `\n${optionsTag(opts.options)}`
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

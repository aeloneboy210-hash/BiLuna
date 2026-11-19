import type { Lang } from '@/lib/i18n/lang'
import { detectLang } from './lang-detect'
import type { AskResult, ChatTurn } from './model'

export const MAX_MESSAGE_LENGTH = 2000

export type SendError = 'limit' | 'busy' | 'unsafe' | 'error' | 'empty' | 'tooLong'

export type SendResult =
  | { ok: true; conversationId: string; reply: { body: string; lang: Lang } }
  | { ok: false; error: SendError; conversationId?: string }

export type SendDeps = {
  createConversation: (title: string) => Promise<string>
  addMessage: (
    conversationId: string,
    author: 'patient' | 'biluna',
    body: string,
    lang: Lang,
  ) => Promise<{ ok: true } | { ok: false; error: 'limit' | 'error' }>
  loadHistory: (conversationId: string) => Promise<ChatTurn[]>
  ask: (history: ChatTurn[], lang: Lang) => Promise<AskResult>
}

/**
 * One patient message, start to finish: check it, save it, ask BiLuna, save the reply.
 * When the AI fails, the patient's message stays saved and nothing from the AI is stored.
 */
export async function handleSend(input: { conversationId: string | null; text: string }, deps: SendDeps): Promise<SendResult> {
  const text = input.text.trim()
  if (!text) return { ok: false, error: 'empty' }
  if (text.length > MAX_MESSAGE_LENGTH) return { ok: false, error: 'tooLong' }

  const lang = detectLang(text)
  const conversationId = input.conversationId ?? (await deps.createConversation(text.slice(0, 60)))

  const saved = await deps.addMessage(conversationId, 'patient', text, lang)
  if (!saved.ok) return { ok: false, error: saved.error, conversationId }

  const history = await deps.loadHistory(conversationId)
  const answer = await deps.ask(history, lang)
  if (!answer.ok) return { ok: false, error: answer.reason, conversationId }

  const stored = await deps.addMessage(conversationId, 'biluna', answer.text, lang)
  if (!stored.ok) return { ok: false, error: 'error', conversationId }

  return { ok: true, conversationId, reply: { body: answer.text, lang } }
}

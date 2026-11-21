import type { Lang } from '@/lib/i18n/lang'
import { attachmentLine, checkAttachment, type Attachment } from './attachment'
import { detectLang } from './lang-detect'
import type { AskResult, ChatTurn } from './model'

export const MAX_MESSAGE_LENGTH = 2000

export type SendError = 'limit' | 'busy' | 'unsafe' | 'error' | 'empty' | 'tooLong' | 'fileType' | 'fileSize'

export type SendResult =
  | { ok: true; conversationId: string; reply: { id: string; body: string; lang: Lang } }
  | { ok: false; error: SendError; conversationId?: string }

export type AiEventKind = 'reply' | 'retry' | 'blocked' | 'clarify' | 'profile_used'

export type SendDeps = {
  createConversation: (title: string) => Promise<string>
  addMessage: (
    conversationId: string,
    author: 'patient' | 'biluna',
    body: string,
    lang: Lang,
  ) => Promise<{ ok: true; id: string } | { ok: false; error: 'limit' | 'error' }>
  loadHistory: (conversationId: string) => Promise<ChatTurn[]>
  /** The profile lines for the AI, or null unless the patient switched on "use my profile in chats". */
  loadProfile: () => Promise<string | null>
  ask: (history: ChatTurn[], lang: Lang, profile: string | null, attachment?: Attachment) => Promise<AskResult>
  logEvent: (kind: AiEventKind, lang?: Lang) => Promise<void>
}

/**
 * One patient message, start to finish: check it, save it, ask BiLuna, save the reply, and log what the
 * AI layer did for the Intelligence page. When the AI fails, the patient's message stays saved and nothing
 * from the AI is stored. A failed log never breaks the chat.
 */
export async function handleSend(
  input: { conversationId: string | null; text: string; attachment?: Attachment; lang?: Lang },
  deps: SendDeps,
): Promise<SendResult> {
  const words = input.text.trim()
  const file = input.attachment
  if (!words && !file) return { ok: false, error: 'empty' }
  if (words.length > MAX_MESSAGE_LENGTH) return { ok: false, error: 'tooLong' }
  if (file) {
    const checked = checkAttachment(file)
    if (!checked.ok) return { ok: false, error: checked.error }
  }
  // The file itself is never saved: the chat keeps a "📎 name" line, with any words under it.
  const text = file ? `${attachmentLine(file.name)}${words ? `\n${words}` : ''}` : words

  const log = async (kind: AiEventKind, lang?: Lang) => {
    try {
      await deps.logEvent(kind, lang)
    } catch {
      // The audit log is best effort; the patient's answer matters more.
    }
  }

  const lang = words ? detectLang(words) : (input.lang ?? 'en')
  const conversationId = input.conversationId ?? (await deps.createConversation(text.slice(0, 60)))

  const saved = await deps.addMessage(conversationId, 'patient', text, lang)
  if (!saved.ok) return { ok: false, error: saved.error, conversationId }

  const [history, profile] = await Promise.all([deps.loadHistory(conversationId), deps.loadProfile()])
  if (profile) await log('profile_used')

  const answer = file ? await deps.ask(history, lang, profile, file) : await deps.ask(history, lang, profile)
  if (!answer.ok) {
    if (answer.reason === 'unsafe') await log('blocked', lang)
    return { ok: false, error: answer.reason, conversationId }
  }

  const stored = await deps.addMessage(conversationId, 'biluna', answer.text, lang)
  if (!stored.ok) return { ok: false, error: 'error', conversationId }

  if (answer.retried) await log('retry', lang)
  if (answer.kind === 'clarify') await log('clarify', lang)
  await log('reply', lang)

  return { ok: true, conversationId, reply: { id: stored.id, body: answer.text, lang } }
}

'use server'

import { requirePortal } from '@/lib/auth/require-portal'
import { addMessage, createConversation, loadHistory } from '@/lib/health/chat-store'
import { askBiLuna } from '@/lib/health/model'
import { profileForPrompt } from '@/lib/health/profile-prompt'
import { handleSend, type SendResult } from '@/lib/health/send'
import { getProfile, logEvent, setFeedback } from '@/lib/intelligence/store'

const UUID = /^[0-9a-f-]{36}$/i

/** Sends one patient message and returns BiLuna's checked reply. */
export async function sendMessage(input: { conversationId: string | null; text: string }): Promise<SendResult> {
  await requirePortal('patient')
  const conversationId = typeof input.conversationId === 'string' && UUID.test(input.conversationId) ? input.conversationId : null
  try {
    return await handleSend(
      { conversationId, text: String(input.text ?? '') },
      {
        createConversation,
        addMessage,
        loadHistory,
        loadProfile: async () => profileForPrompt(await getProfile()),
        ask: (history, lang, profile) => askBiLuna(history, lang, { profile }),
        logEvent,
      },
    )
  } catch (error) {
    console.error('BiLuna send failed', { name: error instanceof Error ? error.name : 'UnknownError' })
    return { ok: false, error: 'error' }
  }
}

/** 👍 or 👎 on one of BiLuna's replies. Stored for reviewed improvements only, never used as training data. */
export async function rateReply(input: { messageId: string; rating: 1 | -1 }): Promise<boolean> {
  await requirePortal('patient')
  if (typeof input.messageId !== 'string' || !UUID.test(input.messageId)) return false
  if (input.rating !== 1 && input.rating !== -1) return false
  const ok = await setFeedback(input.messageId, input.rating)
  if (ok) await logEvent(input.rating === 1 ? 'feedback_up' : 'feedback_down').catch(() => {})
  return ok
}

'use server'

import { revalidatePath } from 'next/cache'
import { requirePortal } from '@/lib/auth/require-portal'
import type { Attachment } from '@/lib/health/attachment'
import type { Lang } from '@/lib/i18n/lang'
import { addMessage, createConversation, deleteAllConversations, deleteConversation, loadHistory } from '@/lib/health/chat-store'
import { askBiLuna } from '@/lib/health/model'
import { profileForPrompt } from '@/lib/health/profile-prompt'
import { handleSend, type SendResult } from '@/lib/health/send'
import { getProfile, logEvent, setFeedback } from '@/lib/intelligence/store'

const UUID = /^[0-9a-f-]{36}$/i

/** Sends one patient message and returns BiLuna's checked reply. */
export async function sendMessage(input: {
  conversationId: string | null
  text: string
  attachment?: Attachment | null
  lang?: Lang
}): Promise<SendResult> {
  await requirePortal('patient')
  const conversationId = typeof input.conversationId === 'string' && UUID.test(input.conversationId) ? input.conversationId : null
  const a = input.attachment
  // Only plain strings get through; the file is checked again inside handleSend and never saved.
  const attachment =
    a && typeof a.name === 'string' && typeof a.mediaType === 'string' && typeof a.data === 'string'
      ? { name: a.name, mediaType: a.mediaType, data: a.data }
      : undefined
  const lang = input.lang === 'bn' || input.lang === 'en' ? input.lang : undefined
  try {
    return await handleSend(
      { conversationId, text: String(input.text ?? ''), attachment, lang },
      {
        createConversation,
        addMessage,
        loadHistory,
        loadProfile: async () => profileForPrompt(await getProfile()),
        ask: (history, lang, profile, file) => askBiLuna(history, lang, { profile, attachment: file }),
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

/** Deletes one past chat, or all of them. The database lets a patient delete only their own chats. */
export async function deleteChats(input: { conversationId: string | 'all' }): Promise<boolean> {
  await requirePortal('patient')
  const id = input.conversationId
  let ok = false
  if (id === 'all') ok = await deleteAllConversations()
  else if (typeof id === 'string' && UUID.test(id)) ok = await deleteConversation(id)
  if (ok) revalidatePath('/patient/health')
  return ok
}

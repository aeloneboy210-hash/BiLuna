'use server'

import { requirePortal } from '@/lib/auth/require-portal'
import { addMessage, createConversation, loadHistory } from '@/lib/health/chat-store'
import { askBiLuna } from '@/lib/health/model'
import { handleSend, type SendResult } from '@/lib/health/send'

/** Sends one patient message and returns BiLuna's checked reply. */
export async function sendMessage(input: { conversationId: string | null; text: string }): Promise<SendResult> {
  await requirePortal('patient')
  const conversationId = typeof input.conversationId === 'string' && /^[0-9a-f-]{36}$/i.test(input.conversationId)
    ? input.conversationId
    : null
  try {
    return await handleSend(
      { conversationId, text: String(input.text ?? '') },
      { createConversation, addMessage, loadHistory, ask: askBiLuna },
    )
  } catch (error) {
    console.error('BiLuna send failed', { name: error instanceof Error ? error.name : 'UnknownError' })
    return { ok: false, error: 'error' }
  }
}

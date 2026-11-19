import 'server-only'
import type { Lang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import type { ChatTurn } from './model'

/**
 * Reads and writes go through the signed-in patient's own session, so the database's
 * access rules decide what they can see. No admin key is used anywhere.
 */
async function db() {
  const supabase = await createClient()
  if (!supabase) throw new Error('Database is not configured')
  return supabase
}

export type ConversationSummary = { id: string; title: string; createdAt: string }
export type StoredMessage = { id: string; author: 'patient' | 'biluna'; body: string; lang: Lang }

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data } = await (await db())
    .from('conversations')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []).map((c) => ({ id: c.id, title: c.title, createdAt: c.created_at }))
}

/** Messages of one conversation; an id the patient does not own returns nothing. */
export async function getMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data } = await (await db())
    .from('messages')
    .select('id, author, body, lang')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return (data ?? []) as StoredMessage[]
}

export async function createConversation(title: string): Promise<string> {
  const { data, error } = await (await db()).from('conversations').insert({ title }).select('id').single()
  if (error || !data) throw new Error('Could not start a conversation')
  return data.id as string
}

export async function addMessage(
  conversationId: string,
  author: 'patient' | 'biluna',
  body: string,
  lang: Lang,
): Promise<{ ok: true } | { ok: false; error: 'limit' | 'error' }> {
  const { error } = await (await db()).from('messages').insert({ conversation_id: conversationId, author, body, lang })
  if (!error) return { ok: true }
  return { ok: false, error: error.message.includes('daily_limit_reached') ? 'limit' : 'error' }
}

export async function loadHistory(conversationId: string): Promise<ChatTurn[]> {
  return (await getMessages(conversationId)).map(({ author, body }) => ({ author, body }))
}

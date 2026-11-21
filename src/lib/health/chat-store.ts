import 'server-only'
import type { Lang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import type { ChatTurn } from './model'

/**
 * Reads and writes go through the signed-in patient's own session, so the database's
 * access rules decide what they can see. No admin key is used anywhere.
 */
export async function db() {
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
): Promise<{ ok: true; id: string } | { ok: false; error: 'limit' | 'error' }> {
  const { data, error } = await (await db())
    .from('messages')
    .insert({ conversation_id: conversationId, author, body, lang })
    .select('id')
    .single()
  if (!error && data) return { ok: true, id: data.id as string }
  if (!error) return { ok: false, error: 'error' }
  return { ok: false, error: error.message.includes('daily_limit_reached') ? 'limit' : 'error' }
}

export async function loadHistory(conversationId: string): Promise<ChatTurn[]> {
  return (await getMessages(conversationId)).map(({ author, body }) => ({ author, body }))
}

/** Deletes one of the patient's own chats (its messages and ratings go with it). Another patient's id deletes nothing. */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await (await db()).from('conversations').delete().eq('id', conversationId)
  return !error
}

/** Deletes all of the signed-in patient's chats; the database's rules limit it to their own. */
export async function deleteAllConversations(): Promise<boolean> {
  const { error } = await (await db()).from('conversations').delete().not('id', 'is', null)
  return !error
}

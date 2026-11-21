import 'server-only'
import { db } from '@/lib/health/chat-store'
import type { HealthProfile } from '@/lib/health/profile-prompt'
import type { AiEventKind } from '@/lib/health/send'
import type { Lang } from '@/lib/i18n/lang'

/** Every query runs as the signed-in patient, so the database's rules limit it to their own rows. */

export type EventKind =
  | AiEventKind
  | 'consent_on'
  | 'consent_off'
  | 'profile_saved'
  | 'profile_deleted'
  | 'feedback_up'
  | 'feedback_down'

export async function getProfile(): Promise<HealthProfile | null> {
  const { data } = await (await db())
    .from('health_profiles')
    .select('age, blood_group, allergies, conditions, medicines, use_in_chat')
    .maybeSingle()
  if (!data) return null
  return {
    age: data.age,
    bloodGroup: data.blood_group,
    allergies: data.allergies,
    conditions: data.conditions,
    medicines: data.medicines,
    useInChat: data.use_in_chat,
  }
}

export async function saveProfile(p: Omit<HealthProfile, 'useInChat'>): Promise<boolean> {
  const supabase = await db()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false
  const { error } = await supabase.from('health_profiles').upsert(
    {
      patient_id: user.user.id,
      age: p.age,
      blood_group: p.bloodGroup,
      allergies: p.allergies,
      conditions: p.conditions,
      medicines: p.medicines,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'patient_id' },
  )
  return !error
}

export async function setConsent(on: boolean): Promise<boolean> {
  const supabase = await db()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false
  const { error } = await supabase
    .from('health_profiles')
    .upsert({ patient_id: user.user.id, use_in_chat: on, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
  return !error
}

export async function deleteProfile(): Promise<boolean> {
  const supabase = await db()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false
  const { error } = await supabase.from('health_profiles').delete().eq('patient_id', user.user.id)
  return !error
}

export async function logEvent(kind: EventKind, lang?: Lang): Promise<void> {
  await (await db()).from('ai_events').insert({ kind, lang: lang ?? null })
}

export type AiEvent = { id: number; kind: EventKind; lang: Lang | null; createdAt: string }

export async function recentEvents(limit = 15): Promise<AiEvent[]> {
  const { data } = await (await db())
    .from('ai_events')
    .select('id, kind, lang, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((e) => ({ id: e.id, kind: e.kind, lang: e.lang, createdAt: e.created_at }))
}

/** Start of today in Dhaka, as an ISO time, to match the database's daily limit. */
export function startOfDhakaDay(now = new Date()): string {
  const dhaka = new Date(now.getTime() + 6 * 3600_000)
  dhaka.setUTCHours(0, 0, 0, 0)
  return new Date(dhaka.getTime() - 6 * 3600_000).toISOString()
}

export async function todaysEvents(): Promise<{ kind: EventKind; lang: Lang | null }[]> {
  const { data } = await (await db())
    .from('ai_events')
    .select('kind, lang')
    .gte('created_at', startOfDhakaDay())
    .limit(1000)
  return (data ?? []) as { kind: EventKind; lang: Lang | null }[]
}

/** Today's count from the database's own tally, which deleting chats cannot reset. */
export async function messagesSentToday(): Promise<number> {
  const today = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10) // Dhaka is UTC+6
  const { data } = await (await db()).from('daily_usage').select('sent').eq('day', today).maybeSingle()
  return (data?.sent as number | undefined) ?? 0
}

/**
 * Saves a 👍 / 👎. Changes only the rating of an existing one, else adds a new one. (An upsert would also try
 * to rewrite which message the rating belongs to, which the database refuses on purpose.)
 */
export async function setFeedback(messageId: string, rating: 1 | -1): Promise<boolean> {
  const table = (await db()).from('message_feedback')
  const { data, error } = await table.update({ rating }).eq('message_id', messageId).select('message_id')
  if (error) return false
  if (data && data.length > 0) return true
  const inserted = await (await db()).from('message_feedback').insert({ message_id: messageId, rating })
  return !inserted.error
}

export async function feedbackFor(messageIds: string[]): Promise<Record<string, 1 | -1>> {
  if (messageIds.length === 0) return {}
  const { data } = await (await db()).from('message_feedback').select('message_id, rating').in('message_id', messageIds)
  return Object.fromEntries((data ?? []).map((f) => [f.message_id, f.rating]))
}

import 'server-only'
import type { Lang } from '@/lib/i18n/lang'
import { db } from '@/lib/health/chat-store'
import { EMPTY_SUMMARY, type SummaryContent } from './summary'

/** What the patient sees for a chat's summary: the content, and whether (and since when) a doctor has it. */
export type PatientSummary = {
  id: string
  lang: Lang
  content: SummaryContent
  createdAt: string
  sharedAt: string | null
  doctorName: string | null
}

/** What the doctor sees: only summaries shared with them and still shared. */
export type SharedSummary = {
  id: string
  patientName: string
  lang: Lang
  content: SummaryContent
  sharedAt: string
}

const asContent = (v: unknown): SummaryContent => ({ ...EMPTY_SUMMARY, ...(v && typeof v === 'object' ? (v as object) : {}) })

/** The demo has one doctor account; the patient shares with that doctor. */
export async function demoDoctor(): Promise<{ id: string; name: string } | null> {
  const { data } = await (await db()).from('profiles').select('id, display_name').eq('role', 'doctor').limit(1).maybeSingle()
  return data ? { id: data.id as string, name: String(data.display_name) } : null
}

export async function summaryForConversation(conversationId: string): Promise<PatientSummary | null> {
  const supabase = await db()
  const { data } = await supabase
    .from('consult_summaries')
    .select('id, lang, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const { data: share } = await supabase
    .from('summary_shares')
    .select('shared_at')
    .eq('summary_id', data.id)
    .is('revoked_at', null)
    .maybeSingle()
  const doctor = share ? await demoDoctor() : null
  return {
    id: data.id as string,
    lang: data.lang as Lang,
    content: asContent(data.content),
    createdAt: data.created_at as string,
    sharedAt: (share?.shared_at as string | undefined) ?? null,
    doctorName: doctor?.name ?? null,
  }
}

/**
 * Saves the summary for a chat. A chat keeps one summary: making it again updates it (and keeps the
 * patient's note and any share), so the doctor always sees the latest version.
 */
export async function saveSummary(input: {
  conversationId: string
  patientName: string
  lang: Lang
  content: SummaryContent
}): Promise<string | null> {
  const supabase = await db()
  const { data: existing } = await supabase
    .from('consult_summaries')
    .select('id, content')
    .eq('conversation_id', input.conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) {
    const content = { ...input.content, note: asContent(existing.content).note }
    const { error } = await supabase
      .from('consult_summaries')
      .update({ content, lang: input.lang, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return error ? null : (existing.id as string)
  }
  const { data, error } = await supabase
    .from('consult_summaries')
    .insert({
      conversation_id: input.conversationId,
      patient_name: input.patientName.slice(0, 80),
      lang: input.lang,
      content: input.content,
    })
    .select('id')
    .single()
  return error ? null : (data.id as string)
}

export async function saveNote(summaryId: string, note: string): Promise<boolean> {
  const supabase = await db()
  const { data } = await supabase.from('consult_summaries').select('content').eq('id', summaryId).maybeSingle()
  if (!data) return false
  const content = { ...asContent(data.content), note: note.trim().slice(0, 500) }
  const { error } = await supabase.from('consult_summaries').update({ content, updated_at: new Date().toISOString() }).eq('id', summaryId)
  return !error
}

/** Shares with the demo doctor. Sharing an already-shared summary is fine (nothing changes). */
export async function shareSummary(summaryId: string): Promise<boolean> {
  const doctor = await demoDoctor()
  if (!doctor) return false
  const { error } = await (await db()).from('summary_shares').insert({ summary_id: summaryId, doctor_id: doctor.id })
  return !error || error.code === '23505'
}

/** Stops every live share of the summary. The doctor loses access at once (the database enforces it). */
export async function stopSharing(summaryId: string): Promise<boolean> {
  const { error } = await (
    await db()
  )
    .from('summary_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('summary_id', summaryId)
    .is('revoked_at', null)
  return !error
}

export async function sharedWithMe(): Promise<SharedSummary[]> {
  const supabase = await db()
  const { data: shares } = await supabase
    .from('summary_shares')
    .select('summary_id, shared_at')
    .is('revoked_at', null)
    .order('shared_at', { ascending: false })
  if (!shares?.length) return []
  const { data: rows } = await supabase
    .from('consult_summaries')
    .select('id, patient_name, lang, content')
    .in(
      'id',
      shares.map((s) => s.summary_id),
    )
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]))
  return shares.flatMap((s) => {
    const r = byId.get(s.summary_id as string)
    return r
      ? [
          {
            id: r.id as string,
            patientName: String(r.patient_name),
            lang: r.lang as Lang,
            content: asContent(r.content),
            sharedAt: s.shared_at as string,
          },
        ]
      : []
  })
}

export async function sharedSummary(id: string): Promise<SharedSummary | null> {
  return (await sharedWithMe()).find((s) => s.id === id) ?? null
}

import 'server-only'
import type { Lang } from '@/lib/i18n/lang'
import { db } from '@/lib/health/chat-store'
import { cleanReview, noteIsOlder } from './review'
import { EMPTY_SUMMARY, type SummaryContent } from './summary'

/** A doctor's note on a shared summary. Written by the doctor, never by BiLuna. */
/** older: the patient changed the summary after the doctor wrote this note. */
export type Review = { body: string; updatedAt: string; older: boolean }

/** What the patient sees for a chat's summary: the content, and whether (and since when) a doctor has it. */
export type PatientSummary = {
  id: string
  lang: Lang
  content: SummaryContent
  createdAt: string
  sharedAt: string | null
  doctorName: string | null
  /** The doctor's note, if one arrived. The patient keeps it even after stopping the share. */
  review: (Review & { doctorName: string }) | null
}

/** What the doctor sees: only summaries shared with them and still shared. */
export type SharedSummary = {
  id: string
  patientName: string
  lang: Lang
  content: SummaryContent
  sharedAt: string
  /** This doctor's own note on the summary, if written. */
  review: Review | null
}

const asContent = (v: unknown): SummaryContent => ({ ...EMPTY_SUMMARY, ...(v && typeof v === 'object' ? (v as object) : {}) })

/** The demo has one doctor account; the patient shares with that doctor. */
/**
 * The doctor this patient can share with: the database shows a patient only doctors on their own side
 * (the demo doctor to demo accounts, verified doctors to real accounts). Null when there is none yet.
 */
export async function demoDoctor(): Promise<{ id: string; name: string } | null> {
  const { data } = await (await db()).from('profiles').select('id, display_name').eq('role', 'doctor').limit(1).maybeSingle()
  return data ? { id: data.id as string, name: String(data.display_name) } : null
}

export async function summaryForConversation(conversationId: string): Promise<PatientSummary | null> {
  const supabase = await db()
  const { data } = await supabase
    .from('consult_summaries')
    .select('id, lang, content, created_at, updated_at')
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
  const { data: review } = await supabase
    .from('summary_reviews')
    .select('body, updated_at')
    .eq('summary_id', data.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const doctor = share || review ? await demoDoctor() : null
  return {
    id: data.id as string,
    lang: data.lang as Lang,
    content: asContent(data.content),
    createdAt: data.created_at as string,
    sharedAt: (share?.shared_at as string | undefined) ?? null,
    doctorName: doctor?.name ?? null,
    review: review
      ? {
          body: String(review.body),
          updatedAt: review.updated_at as string,
          older: noteIsOlder(review.updated_at as string, data.updated_at as string),
          doctorName: doctor?.name ?? '',
        }
      : null,
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
    .select('id, patient_name, lang, content, updated_at')
    .in(
      'id',
      shares.map((s) => s.summary_id),
    )
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]))
  // The database returns only this doctor's own notes, and only on summaries still shared.
  const { data: reviews } = await supabase.from('summary_reviews').select('summary_id, body, updated_at')
  const reviewOf = new Map(
    (reviews ?? []).map((r) => [
      r.summary_id as string,
      {
        body: String(r.body),
        updatedAt: r.updated_at as string,
        older: noteIsOlder(r.updated_at as string, byId.get(r.summary_id as string)?.updated_at as string | undefined),
      },
    ]),
  )
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
            review: reviewOf.get(r.id as string) ?? null,
          },
        ]
      : []
  })
}

export async function sharedSummary(id: string): Promise<SharedSummary | null> {
  return (await sharedWithMe()).find((s) => s.id === id) ?? null
}

/**
 * The doctor writes or edits their note on a shared summary. The database refuses it once the patient
 * stops sharing, and fills in which patient it belongs to from the summary itself.
 */
export async function saveReview(summaryId: string, body: unknown): Promise<Review | null> {
  const text = cleanReview(body)
  if (!text) return null
  const supabase = await db()
  const now = new Date().toISOString()
  const { data: updated } = await supabase
    .from('summary_reviews')
    .update({ body: text, updated_at: now })
    .eq('summary_id', summaryId)
    .select('body, updated_at')
    .maybeSingle()
  if (updated) return { body: String(updated.body), updatedAt: updated.updated_at as string, older: false }
  const { data, error } = await supabase
    .from('summary_reviews')
    .insert({ summary_id: summaryId, body: text })
    .select('body, updated_at')
    .single()
  return error ? null : { body: String(data.body), updatedAt: data.updated_at as string, older: false }
}

/** For the patient's home page: every doctor's note on their summaries, newest first. */
export type DoctorNote = {
  summaryId: string
  conversationId: string | null
  concern: string
  review: Review & { doctorName: string }
}

export async function doctorNotesForMe(): Promise<DoctorNote[]> {
  const supabase = await db()
  const { data: reviews } = await supabase
    .from('summary_reviews')
    .select('summary_id, body, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10)
  if (!reviews?.length) return []
  const { data: rows } = await supabase
    .from('consult_summaries')
    .select('id, conversation_id, content, updated_at')
    .in(
      'id',
      reviews.map((r) => r.summary_id),
    )
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]))
  const doctor = await demoDoctor()
  return reviews.flatMap((r) => {
    const s = byId.get(r.summary_id as string)
    return s
      ? [
          {
            summaryId: s.id as string,
            conversationId: (s.conversation_id as string | null) ?? null,
            concern: asContent(s.content).concern,
            review: {
              body: String(r.body),
              updatedAt: r.updated_at as string,
              older: noteIsOlder(r.updated_at as string, s.updated_at as string),
              doctorName: doctor?.name ?? '',
            },
          },
        ]
      : []
  })
}

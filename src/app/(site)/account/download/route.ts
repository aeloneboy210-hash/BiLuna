import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * "Download my data": one JSON file with everything BiLuna keeps about the signed-in person. Every read
 * goes through their own session, so the database's rules decide what is theirs; nothing else can appear.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  if (!supabase || !user) return new NextResponse('Not signed in', { status: 401 })

  const [profile, health, conversations, messages, summaries, shares, notes, feedback, usage, events] = await Promise.all([
    supabase.from('profiles').select('display_name, role, lang, consented_at, consent_version, created_at').eq('id', user.id).maybeSingle(),
    supabase.from('health_profiles').select('age, blood_group, allergies, conditions, medicines, use_in_chat, updated_at').maybeSingle(),
    supabase.from('conversations').select('id, title, created_at').order('created_at'),
    supabase.from('messages').select('conversation_id, author, body, lang, created_at').order('created_at'),
    supabase.from('consult_summaries').select('id, conversation_id, lang, content, created_at, updated_at').order('created_at'),
    supabase.from('summary_shares').select('summary_id, shared_at, revoked_at').order('shared_at'),
    supabase.from('summary_reviews').select('summary_id, body, created_at, updated_at').order('created_at'),
    supabase.from('message_feedback').select('message_id, rating, created_at'),
    supabase.from('daily_usage').select('day, sent').order('day'),
    supabase.from('ai_events').select('kind, created_at').order('created_at'),
  ])

  const file = {
    about: 'Everything BiLuna keeps about you, downloaded from your account. Uploaded files are never kept, so they are not here.',
    downloaded_at: new Date().toISOString(),
    account: { email: user.email, ...(profile.data ?? {}) },
    health_profile: health.data ?? null,
    chats: (conversations.data ?? []).map((c) => ({
      ...c,
      messages: (messages.data ?? [])
        .filter((m) => m.conversation_id === c.id)
        .map((m) => ({ author: m.author, body: m.body, lang: m.lang, created_at: m.created_at })),
    })),
    doctor_summaries: summaries.data ?? [],
    sharing: shares.data ?? [],
    doctor_notes: notes.data ?? [],
    ratings: feedback.data ?? [],
    daily_usage: usage.data ?? [],
    activity: events.data ?? [],
  }

  return new NextResponse(JSON.stringify(file, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="biluna-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireSignedIn } from '@/lib/auth/require-portal'
import { cleanName } from '@/lib/auth/account-rules'
import { getDict } from '@/lib/i18n/server'
import { LANG_COOKIE, type Lang } from '@/lib/i18n/lang'
import { CONSENT_VERSION } from '@/lib/legal/content'
import { PORTALS } from '@/lib/portals'
import { createClient } from '@/lib/supabase/server'

export type ConsentState = { error: string | null }

/** The welcome screen's "Start": both boxes ticked, then the agreement is recorded by the database. */
export async function giveConsent(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const { dict } = await getDict()
  const session = await requireSignedIn()
  if (formData.get('agree') !== 'yes' || formData.get('age') !== 'yes') return { error: dict.consent.needBoth }
  const supabase = await createClient()
  if (!supabase) return { error: dict.consent.failed }
  const { error } = await supabase.rpc('record_consent', { version: CONSENT_VERSION })
  if (error) return { error: dict.consent.failed }
  redirect(PORTALS[session.role].home)
}

export type AccountState = { error: string | null; saved: boolean }

/** Name and language. Demo accounts are refused by the database too. */
export async function saveAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const { dict } = await getDict()
  const session = await requireSignedIn()
  if (session.isDemo) return { error: dict.account.demoNote, saved: false }
  const name = cleanName(formData.get('name'))
  const raw = formData.get('lang')
  const lang: Lang | null = raw === 'en' || raw === 'bn' ? raw : null
  if (!name) return { error: dict.account.saveFailed, saved: false }
  const supabase = await createClient()
  if (!supabase) return { error: dict.account.saveFailed, saved: false }
  const { error } = await supabase.rpc('update_my_account', { new_name: name, new_lang: lang })
  if (error) return { error: dict.account.saveFailed, saved: false }
  if (lang) (await cookies()).set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return { error: null, saved: true }
}

export type DeleteState = { error: string | null }

/** Deletes the signed-in person's account and everything in it, after they type DELETE. */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { dict } = await getDict()
  const session = await requireSignedIn()
  if (session.isDemo) return { error: dict.account.demoNote }
  if (String(formData.get('confirm') ?? '').trim() !== 'DELETE') return { error: dict.account.deleteConfirm }
  const supabase = await createClient()
  if (!supabase) return { error: dict.account.deleteFailed }
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return { error: dict.account.deleteFailed }
  // The login no longer exists; clear the cookies it left behind.
  await supabase.auth.signOut().catch(() => undefined)
  redirect('/')
}

'use server'

import { redirect } from 'next/navigation'
import { tryDemo } from '@/lib/auth/try-demo'
import { getDict } from '@/lib/i18n/server'
import { isRole, PORTALS } from '@/lib/portals'
import { createClient } from '@/lib/supabase/server'

export type SignInState = { error: string | null }

/**
 * Every failure returns the same message, so the page never reveals
 * whether the email exists or which of the two fields was wrong.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const { dict } = await getDict()
  const failed: SignInState = { error: dict.signIn.error }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return failed

  const supabase = await createClient()
  if (!supabase) return failed

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return failed

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()

  if (!profile || !isRole(profile.role)) {
    // A real login without a demo profile has no portal to go to.
    await supabase.auth.signOut()
    return failed
  }

  redirect(PORTALS[profile.role].home)
}

/** One tap, no password typed: opens the shared demo account for the chosen portal. */
export async function startDemo(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const result = await tryDemo(formData.get('role'), {
    password: process.env.BILUNA_DEMO_PASSWORD,
    signIn: async (email, password) => {
      if (!supabase) return false
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return !error && Boolean(data.user)
    },
  })
  redirect(result.ok ? result.home : `/sign-in?demo=${result.reason}`)
}

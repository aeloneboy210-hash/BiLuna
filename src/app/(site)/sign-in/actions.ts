'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNext } from '@/lib/access/route-guard'
import { cleanEmail, cleanName, isDemoEmail, passwordOk } from '@/lib/auth/account-rules'
import { siteOrigin } from '@/lib/auth/origin'
import { tryDemo } from '@/lib/auth/try-demo'
import { getDict } from '@/lib/i18n/server'
import { LANG_COOKIE } from '@/lib/i18n/lang'
import { isRole, PORTALS } from '@/lib/portals'
import { createClient } from '@/lib/supabase/server'

export type SignInState = { error: string | null }

/** Rate limits from the auth server get their own message; everything else the same calm one. */
function tooMany(error: { status?: number; code?: string } | null): boolean {
  return error?.status === 429 || error?.code === 'over_request_rate_limit' || error?.code === 'over_email_send_rate_limit'
}

/** After any sign-in: the account's saved language becomes the site's, then to consent or the portal. */
async function goHome(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string): Promise<never> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, consented_at, lang')
    .eq('id', userId)
    .maybeSingle()
  if (!profile || !isRole(profile.role)) {
    await supabase.auth.signOut()
    redirect('/sign-in')
  }
  if (profile.lang === 'en' || profile.lang === 'bn') {
    ;(await cookies()).set(LANG_COOKIE, profile.lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  }
  redirect(profile.consented_at ? PORTALS[profile.role].home : '/welcome')
}

/**
 * Every wrong email or password gets the same message, so the page never reveals whether an email
 * has an account. Only an unconfirmed email is told to open its link.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const { dict } = await getDict()
  const failed: SignInState = { error: dict.signIn.error }

  const email = cleanEmail(formData.get('email'))
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return failed

  const supabase = await createClient()
  if (!supabase) return { error: dict.auth.failed }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (tooMany(error)) return { error: dict.auth.tooMany }
  if (error?.code === 'email_not_confirmed') return { error: dict.auth.confirmFirst }
  if (error || !data.user) return failed
  return goHome(supabase, data.user.id)
}

export type SignUpState = { error: string | null; sentTo: string | null }

/**
 * A new account: name, email, password. The email gets a link to confirm. The answer is the same
 * whether or not the email already has an account, so no one can find out who uses BiLuna.
 */
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const { dict } = await getDict()
  const name = cleanName(formData.get('name'))
  const email = cleanEmail(formData.get('email'))
  const password = formData.get('password')
  if (!name) return { error: dict.auth.badName, sentTo: null }
  if (!email || isDemoEmail(email)) return { error: dict.auth.badEmail, sentTo: null }
  if (!passwordOk(password)) return { error: dict.auth.badPassword, sentTo: null }

  const supabase = await createClient()
  if (!supabase) return { error: dict.auth.failed, sentTo: null }
  const origin = await siteOrigin()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/confirm?next=/welcome` },
  })
  // The per-email "wait a minute" limit only happens for an email that already has an account; treating it
  // as sent keeps the answer the same for everyone, so no one can test whether an email uses BiLuna.
  if (error?.code === 'over_email_send_rate_limit' || error?.code === 'user_already_exists') return { error: null, sentTo: email }
  if (tooMany(error)) return { error: dict.auth.tooMany, sentTo: null }
  if (error?.code === 'weak_password') return { error: dict.auth.badPassword, sentTo: null }
  if (error) return { error: dict.auth.failed, sentTo: null }
  return { error: null, sentTo: email }
}

/** Google sign-in: off to Google, back to /auth/callback, which signs the person in. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient()
  if (!supabase) redirect('/sign-in?auth=google')
  const origin = await siteOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error || !data.url) redirect('/sign-in?auth=google')
  redirect(data.url)
}

export type ResetState = { error: string | null; sentTo: string | null }

/** Sends a link to choose a new password. Same answer whether or not the email has an account. */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const { dict } = await getDict()
  const email = cleanEmail(formData.get('email'))
  if (!email) return { error: dict.auth.badEmail, sentTo: null }
  if (isDemoEmail(email)) return { error: null, sentTo: email }
  const supabase = await createClient()
  if (!supabase) return { error: dict.auth.failed, sentTo: null }
  const origin = await siteOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  })
  // Same answer for every email (see signUp): only the site-wide limit is reported.
  if (error?.code === 'over_request_rate_limit' || (error?.status === 429 && error?.code !== 'over_email_send_rate_limit'))
    return { error: dict.auth.tooMany, sentTo: null }
  return { error: null, sentTo: email }
}

export type NewPasswordState = { error: string | null }

/** Sets the new password for the person signed in by the reset link, then on to their portal. */
export async function setNewPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const { dict } = await getDict()
  const password = formData.get('password')
  if (!passwordOk(password)) return { error: dict.auth.badPassword }
  const supabase = await createClient()
  if (!supabase) return { error: dict.auth.failed }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  if (isDemoEmail(user.email ?? '')) return { error: dict.auth.failed }
  const { error } = await supabase.auth.updateUser({ password })
  if (error?.code === 'weak_password' || error?.code === 'same_password') return { error: dict.auth.badPassword }
  if (error) return { error: dict.auth.failed }
  return goHome(supabase, user.id)
}

const LINK_TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'email_change']

/**
 * The "Continue" button on the page an email link opens. Only this tap signs the person in, so a link
 * sent by someone else cannot sign a visitor into a stranger's account without them noticing, and email
 * scanners that open links do not use them up.
 */
export async function confirmEmailLink(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get('token_hash') ?? '')
  const code = String(formData.get('code') ?? '')
  const type = String(formData.get('type') ?? '') as EmailOtpType
  const next = safeNext(String(formData.get('next') ?? '') || (type === 'recovery' ? '/reset-password' : '/welcome'))
  const supabase = await createClient()
  if (supabase && tokenHash && LINK_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect(next)
  }
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
  }
  redirect('/sign-in?auth=link')
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

import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNext } from '@/lib/access/route-guard'
import { createClient } from '@/lib/supabase/server'

const TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'email_change']

/**
 * The link in BiLuna's emails (confirm your email, choose a new password) lands here. It works on any
 * phone or computer, not only the one that asked for it. An expired or used link goes back to sign-in.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = safeNext(url.searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/welcome'))
  const supabase = await createClient()
  if (supabase && tokenHash && type && TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  // Supabase's standard email link comes back with a one-time code instead; it works on the same
  // phone or computer that asked for the email.
  const code = url.searchParams.get('code')
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/sign-in?auth=link', url.origin))
}

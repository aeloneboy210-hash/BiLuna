import { NextResponse, type NextRequest } from 'next/server'
import { safeNext } from '@/lib/access/route-guard'
import { createClient } from '@/lib/supabase/server'

/**
 * Google sends people back here with a one-time code. It becomes a signed-in session (cookies), then
 * the home page sends them to consent or their portal. A missing or bad code goes back to sign-in.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next') ?? '/welcome')
  if (code) {
    const supabase = await createClient()
    const result = supabase ? await supabase.auth.exchangeCodeForSession(code) : null
    if (result && !result.error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/sign-in?auth=google', url.origin))
}

import { cache } from 'react'
import { CONSENT_VERSION } from '@/lib/legal/content'
import { isRole, type Role } from '@/lib/portals'
import { createClient } from '@/lib/supabase/server'

export type Session = {
  role: Role
  displayName: string
  /** One of the three shared demo accounts (made-up data only). */
  isDemo: boolean
  /** The person has agreed to the terms and privacy policy (always true for demo accounts). */
  consented: boolean
  /** The language saved on the account, if they chose one. */
  lang: 'en' | 'bn' | null
}

/**
 * The signed-in account, checked with the auth server on every request.
 * Null when signed out, when the account has no profile, or when the database cannot be reached.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name, is_demo, consented_at, consent_version, lang')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !isRole(profile.role)) return null
  return {
    role: profile.role,
    displayName: String(profile.display_name),
    isDemo: profile.is_demo === true,
    // Agreed to the current terms (a new version asks again). Demo accounts always count as agreed.
    consented: profile.is_demo === true || (profile.consented_at != null && profile.consent_version === CONSENT_VERSION),
    lang: profile.lang === 'bn' || profile.lang === 'en' ? profile.lang : null,
  }
})

export async function getSessionRole(): Promise<Role | null> {
  return (await getSession())?.role ?? null
}

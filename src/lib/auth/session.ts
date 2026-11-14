import { cache } from 'react'
import { isRole, type Role } from '@/lib/portals'
import { createClient } from '@/lib/supabase/server'

export type Session = { role: Role; displayName: string }

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
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !isRole(profile.role)) return null
  return { role: profile.role, displayName: String(profile.display_name) }
})

export async function getSessionRole(): Promise<Role | null> {
  return (await getSession())?.role ?? null
}

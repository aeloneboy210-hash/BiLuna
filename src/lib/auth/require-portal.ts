import { redirect } from 'next/navigation'
import { resolveRedirect } from '@/lib/access/route-guard'
import { PORTALS, type Role } from '@/lib/portals'
import { getSession, type Session } from './session'

/**
 * Second gate behind the proxy. A portal page calls this before rendering anything,
 * so it stays protected even if the proxy is misconfigured or skipped.
 */
export async function requirePortal(portal: Role): Promise<Session> {
  const session = await getSession()
  const target = resolveRedirect(PORTALS[portal].home, session?.role ?? null)
  if (target) redirect(target)
  // resolveRedirect returned null, so the session exists and its role owns this portal.
  return session as Session
}

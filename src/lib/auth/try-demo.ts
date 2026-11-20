import { isRole, PORTALS, type PortalHome } from '@/lib/portals'
import { DEMO_ACCOUNTS } from './setup-password'

export type TryDemoResult = { ok: true; home: PortalHome } | { ok: false; reason: 'notReady' | 'failed' }

/**
 * "Try as Patient / Doctor / Hospital": signs the visitor in to the shared demo account for that role.
 * The password comes from the server setting BILUNA_DEMO_PASSWORD and never reaches the browser.
 */
export async function tryDemo(
  role: unknown,
  deps: { password: string | undefined; signIn: (email: string, password: string) => Promise<boolean> },
): Promise<TryDemoResult> {
  if (!isRole(role)) return { ok: false, reason: 'failed' }
  if (!deps.password) return { ok: false, reason: 'notReady' }
  const account = DEMO_ACCOUNTS.find((a) => a.role === role)
  if (!account) return { ok: false, reason: 'failed' }
  const ok = await deps.signIn(account.email, deps.password)
  return ok ? { ok: true, home: PORTALS[role].home } : { ok: false, reason: 'failed' }
}

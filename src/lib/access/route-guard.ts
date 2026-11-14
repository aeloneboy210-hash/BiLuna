import { PORTALS, ROLES, type Role } from '@/lib/portals'

const SIGN_IN = '/sign-in'

function normalise(pathname: string): string {
  const lower = pathname.toLowerCase()
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower
}

function isWithin(path: string, home: string): boolean {
  return path === home || path.startsWith(`${home}/`)
}

/**
 * The single place that decides who may open which path.
 * Returns the path to redirect to, or null when the request may continue.
 */
export function resolveRedirect(pathname: string, role: Role | null): string | null {
  const path = normalise(pathname)
  const owner = ROLES.find((candidate) => isWithin(path, PORTALS[candidate].home))

  if (owner) {
    if (!role) return SIGN_IN
    return owner === role ? null : PORTALS[role].home
  }

  if (path === SIGN_IN && role) return PORTALS[role].home

  return null
}

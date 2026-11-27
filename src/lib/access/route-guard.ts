import { PORTALS, ROLES, type Role } from '@/lib/portals'

const SIGN_IN = '/sign-in'
/** Only for visitors who are not signed in: a signed-in person is sent to their portal. */
const SIGNED_OUT_ONLY = [SIGN_IN, '/sign-up', '/forgot-password']
/** Any signed-in account, whatever its role: consent, the account page, a new password after a reset. */
const SIGNED_IN_ONLY = ['/welcome', '/account', '/reset-password']

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

  if (SIGNED_IN_ONLY.some((p) => isWithin(path, p))) return role ? null : SIGN_IN

  if (SIGNED_OUT_ONLY.includes(path) && role) return PORTALS[role].home

  return null
}

/**
 * Where to go after a sign-in link: only a path on this site. Anything else (another site, "//x",
 * "/\\x", a script) becomes the home page, so a link in an email can never send someone elsewhere.
 */
export function safeNext(next: string | null | undefined): string {
  // Control characters (tab, new line) are dropped by browsers and URL parsers, which can turn "/\t/x"
  // into "//x"; refuse them and backslashes outright, then let the URL parser have the final word.
  if (!next || !next.startsWith('/') || /[\u0000-\u001F\u007F\\]/.test(next)) return '/'
  const base = 'https://biluna.invalid'
  let url: URL
  try {
    url = new URL(next, base)
  } catch {
    return '/'
  }
  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : '/'
}

/** True for the paths where the account's role decides what happens: the portals, sign-in and account pages. */
export function needsRole(pathname: string): boolean {
  const path = normalise(pathname)
  return (
    SIGNED_OUT_ONLY.includes(path) ||
    SIGNED_IN_ONLY.some((p) => isWithin(path, p)) ||
    ROLES.some((role) => isWithin(path, PORTALS[role].home))
  )
}

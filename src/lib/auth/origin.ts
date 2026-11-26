import 'server-only'
import { headers } from 'next/headers'

/**
 * This site's own address (https://biluna.vercel.app, or a preview link), for the return addresses in
 * sign-in emails and Google sign-in. Supabase only accepts return addresses on its allow list, so a
 * forged Host header cannot send anyone to another site.
 */
export async function siteOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'biluna.vercel.app'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

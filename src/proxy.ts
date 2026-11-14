import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveRedirect } from '@/lib/access/route-guard'
import { isRole, type Role } from '@/lib/portals'
import { getSupabaseEnv } from '@/lib/supabase/env'

/**
 * Runs before every portal and sign-in request: refreshes the session cookie,
 * finds the account's role and redirects when the path is not theirs to open.
 * The portal pages repeat the check themselves, so this is the first gate, not the only one.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  let role: Role | null = null

  const env = getSupabaseEnv()
  if (env) {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      role = isRole(data?.role) ? data.role : null
    }
  }

  const target = resolveRedirect(request.nextUrl.pathname, role)
  if (!target) return response

  const url = request.nextUrl.clone()
  url.pathname = target
  url.search = ''
  const redirect = NextResponse.redirect(url)
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}

export const config = {
  matcher: ['/patient/:path*', '/doctor/:path*', '/org/:path*', '/sign-in'],
}

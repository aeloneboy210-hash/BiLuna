import { PortalFrame } from '@/components/portal/PortalFrame'
import { getSession } from '@/lib/auth/session'
import { getDict } from '@/lib/i18n/server'

/**
 * The frame for the three portals. Each portal page still checks the role itself (requirePortal),
 * so a missing session here only means the page will redirect before showing anything.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [{ lang, dict }, session] = await Promise.all([getDict(), getSession()])
  if (!session) return <>{children}</>

  return (
    <PortalFrame session={session} dict={dict} lang={lang}>
      {children}
    </PortalFrame>
  )
}

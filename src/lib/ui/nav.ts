import { MODULES, moduleHref, type ModuleId } from '@/lib/modules'
import { PORTALS, type Role } from '@/lib/portals'
import type { IconName } from './icons'
import { MODULE_ICONS } from './module-icons'

export type NavKey = 'dashboard' | 'roadmap' | ModuleId

export type NavItem = { key: NavKey; href: string; icon: IconName }

/**
 * The sidebar for each portal. Patients see the eight modules; doctors and hospitals see only
 * their own dashboard and the roadmap. No item ever links into another role's portal.
 */
export function navFor(role: Role): NavItem[] {
  const dashboard: NavItem = { key: 'dashboard', href: PORTALS[role].home, icon: 'home' }
  const roadmap: NavItem = { key: 'roadmap', href: '/roadmap', icon: 'map' }

  if (role !== 'patient') return [dashboard, roadmap]

  return [dashboard, ...MODULES.map((m) => ({ key: m.id, href: moduleHref(m), icon: MODULE_ICONS[m.id] }))]
}

import type { ModuleId } from '@/lib/modules'
import type { Role } from '@/lib/portals'
import type { IconName } from './icons'

export const MODULE_ICONS: Record<ModuleId, IconName> = {
  health: 'heart',
  intelligence: 'brain',
  medicine: 'pill',
  navigator: 'mapPin',
  wellness: 'leaf',
  academy: 'book',
  careers: 'briefcase',
  economics: 'coins',
}

export const ROLE_ICONS: Record<Role, IconName> = {
  patient: 'user',
  doctor: 'stethoscope',
  org_admin: 'hospital',
}

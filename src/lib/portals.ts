export type Role = 'patient' | 'doctor' | 'org_admin'

export type PortalHome = '/patient' | '/doctor' | '/org'

export const ROLES: readonly Role[] = ['patient', 'doctor', 'org_admin']

export const PORTALS: Record<Role, { name: string; home: PortalHome }> = {
  patient: { name: 'Patient Portal', home: '/patient' },
  doctor: { name: 'Healthcare Professional Portal', home: '/doctor' },
  org_admin: { name: 'Hospitals & Organizations Portal', home: '/org' },
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

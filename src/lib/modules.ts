export type ModuleStatus = 'working' | 'planned'

export type ModuleId =
  | 'health'
  | 'intelligence'
  | 'medicine'
  | 'navigator'
  | 'wellness'
  | 'academy'
  | 'careers'
  | 'economics'

export type BiLunaModule = { id: ModuleId; name: string; status: ModuleStatus }

/** The eight BiLuna modules. Each feature flips its module to 'working' when it ships. */
export const MODULES: readonly BiLunaModule[] = [
  { id: 'health', name: 'BiLuna Health', status: 'planned' },
  { id: 'intelligence', name: 'BiLuna Intelligence', status: 'planned' },
  { id: 'medicine', name: 'BiLuna Medicine', status: 'planned' },
  { id: 'navigator', name: 'BiLuna Navigator', status: 'planned' },
  { id: 'wellness', name: 'BiLuna Wellness', status: 'planned' },
  { id: 'academy', name: 'BiLuna Academy', status: 'planned' },
  { id: 'careers', name: 'BiLuna Careers', status: 'planned' },
  { id: 'economics', name: 'BiLuna Economics', status: 'planned' },
]

export function moduleHref(m: Pick<BiLunaModule, 'id' | 'status'>): string {
  return m.status === 'working' ? `/patient/${m.id}` : `/roadmap#${m.id}`
}

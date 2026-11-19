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

/** 'demo' modules are built for the competition demo; 'roadmap' modules are shown but not built. */
export type ModuleScope = 'demo' | 'roadmap'

export type BiLunaModule = { id: ModuleId; name: string; status: ModuleStatus; scope: ModuleScope }

/** The eight BiLuna modules. Each feature flips its module to 'working' when it ships. */
export const MODULES: readonly BiLunaModule[] = [
  { id: 'health', scope: 'demo', name: 'BiLuna Health', status: 'working' },
  { id: 'intelligence', scope: 'roadmap', name: 'BiLuna Intelligence', status: 'planned' },
  { id: 'medicine', scope: 'demo', name: 'BiLuna Medicine', status: 'planned' },
  { id: 'navigator', scope: 'demo', name: 'BiLuna Navigator', status: 'planned' },
  { id: 'wellness', scope: 'roadmap', name: 'BiLuna Wellness', status: 'planned' },
  { id: 'academy', scope: 'demo', name: 'BiLuna Academy', status: 'planned' },
  { id: 'careers', scope: 'roadmap', name: 'BiLuna Careers', status: 'planned' },
  { id: 'economics', scope: 'demo', name: 'BiLuna Economics', status: 'planned' },
]

export function moduleHref(m: Pick<BiLunaModule, 'id' | 'status'>): string {
  return m.status === 'working' ? `/patient/${m.id}` : `/roadmap#${m.id}`
}

export type ModuleStatusKey = 'working' | 'comingNext' | 'roadmap'

/** Which label to show for a module: open now, coming in this demo, or roadmap only. */
export function moduleStatusKey(m: Pick<BiLunaModule, 'status' | 'scope'>): ModuleStatusKey {
  if (m.status === 'working') return 'working'
  return m.scope === 'demo' ? 'comingNext' : 'roadmap'
}

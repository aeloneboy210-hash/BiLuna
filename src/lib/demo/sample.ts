/**
 * Invented numbers and records that fill the dashboards until the real features exist.
 * Every screen that uses them shows a "Sample data" tag. Nothing here describes a real person.
 */

export const SAMPLE_PATIENT_PROFILE = { age: 34, bloodGroup: 'B+', conditionsAdded: false } as const

export const SAMPLE_SHARED = [
  { id: 's1', patient: 'rahima', concern: 'concernCough', when: 'today' },
  { id: 's2', patient: 'jamal', concern: 'concernHeadache', when: 'yesterday' },
] as const

export const SAMPLE_ORG_TOTALS = { patients: 40, conversations: 126, shared: 18, emergencies: 3 } as const

export const SAMPLE_CONCERNS = [
  { key: 'fever', count: 34 },
  { key: 'stomach', count: 22 },
  { key: 'headache', count: 19 },
  { key: 'skin', count: 12 },
  { key: 'other', count: 39 },
] as const

/** How much of a profile is filled in, for the progress ring. Blank text counts as missing. */
export function profileCompleteness(fields: Record<string, string | null>): {
  filled: number
  total: number
  percent: number
} {
  const values = Object.values(fields)
  const filled = values.filter((v) => v !== null && v.trim() !== '').length
  const total = values.length
  return { filled, total, percent: total === 0 ? 0 : Math.round((filled / total) * 100) }
}

/** Real milestones of this build, newest first, shown in "Latest updates". */
export const BUILD_UPDATES = [
  { key: 'intelligence', date: '2026-11-20' },
  { key: 'chat', date: '2026-11-19' },
  { key: 'design', date: '2026-11-15' },
  { key: 'core', date: '2026-11-15' },
  { key: 'plan', date: '2026-11-14' },
] as const

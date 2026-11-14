/**
 * Invented numbers and records that fill the dashboards until the real features exist.
 * Every screen that uses them shows a "Sample data" tag. Nothing here describes a real person.
 */

export const SAMPLE_PATIENT_PROFILE = { age: 34, bloodGroup: 'B+' } as const

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

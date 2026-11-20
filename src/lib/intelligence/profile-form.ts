import type { HealthProfile } from '@/lib/health/profile-prompt'

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

type FormLike = { get: (key: string) => unknown }
export type ProfileInput = Omit<HealthProfile, 'useInChat'>

/** Reads the profile form. Mirrors the database's checks so a bad value gets a clear message. */
export function parseProfileForm(form: FormLike): { ok: true; profile: ProfileInput } | { ok: false } {
  const text = (key: string) => {
    const v = form.get(key)
    return typeof v === 'string' ? v.trim() : ''
  }

  const ageText = text('age')
  let age: number | null = null
  if (ageText) {
    if (!/^\d{1,3}$/.test(ageText)) return { ok: false }
    age = Number(ageText)
    if (age > 120) return { ok: false }
  }

  const blood = text('bloodGroup')
  if (blood && !(BLOOD_GROUPS as readonly string[]).includes(blood)) return { ok: false }

  const fields = ['allergies', 'conditions', 'medicines'] as const
  const values: Record<(typeof fields)[number], string | null> = { allergies: null, conditions: null, medicines: null }
  for (const f of fields) {
    const v = text(f)
    if (v.length > 200) return { ok: false }
    values[f] = v || null
  }

  return { ok: true, profile: { age, bloodGroup: blood || null, ...values } }
}

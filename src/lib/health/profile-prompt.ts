/** A patient's saved health profile, as the app reads it. All values are fictional in the demo. */
export type HealthProfile = {
  age: number | null
  bloodGroup: string | null
  allergies: string | null
  conditions: string | null
  medicines: string | null
  useInChat: boolean
}

const clean = (v: string | number | null) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)

/**
 * The profile as lines for BiLuna's instructions, or null when the patient has not allowed it
 * or nothing is filled in. Line breaks are flattened so a field cannot start a new line of instructions.
 */
export function profileForPrompt(p: HealthProfile | null): string | null {
  if (!p || !p.useInChat) return null
  const rows: [string, string | number | null][] = [
    ['Age', p.age],
    ['Blood group', p.bloodGroup],
    ['Allergies', p.allergies],
    ['Conditions', p.conditions],
    ['Regular medicines', p.medicines],
  ]
  const lines = rows.filter(([, v]) => clean(v)).map(([k, v]) => `- ${k}: ${clean(v)}`)
  return lines.length ? lines.join('\n') : null
}

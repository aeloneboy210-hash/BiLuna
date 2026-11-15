import type { Role } from '@/lib/portals'

/** The three fictional demo accounts. The same emails are listed in the demo_accounts table. */
export const DEMO_ACCOUNTS: readonly { email: string; role: Role }[] = [
  { email: 'patient@biluna.demo', role: 'patient' },
  { email: 'doctor@biluna.demo', role: 'doctor' },
  { email: 'hospital@biluna.demo', role: 'org_admin' },
]

export const DEMO_EMAILS: readonly string[] = DEMO_ACCOUNTS.map((a) => a.email)

export type SetupPasswordProblem = 'tooShort' | 'tooLong' | 'mismatch'

/** 72 is the longest password the hashing scheme can tell apart; the database enforces the same limits. */
export function checkSetupPassword(password: string, confirm: string): SetupPasswordProblem | null {
  if (password.length < 8) return 'tooShort'
  if (password.length > 72) return 'tooLong'
  if (password !== confirm) return 'mismatch'
  return null
}

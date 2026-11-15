'use server'

import { checkSetupPassword } from '@/lib/auth/setup-password'
import { getDict } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'

export type SetupState = { error: string | null; done: boolean }

/**
 * Saves the owner's chosen password on the three demo accounts.
 * The database function behind it works once only and re-checks the length itself,
 * so this action cannot be used to change a password that is already set.
 */
export async function setDemoPassword(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const { dict } = await getDict()

  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  const problem = checkSetupPassword(password, confirm)
  if (problem) return { error: dict.setup[problem], done: false }

  const supabase = await createClient()
  if (!supabase) return { error: dict.setup.failed, done: false }

  const { data, error } = await supabase.rpc('set_demo_password', { new_password: password })
  if (error || data !== true) return { error: dict.setup.failed, done: false }

  return { error: null, done: true }
}

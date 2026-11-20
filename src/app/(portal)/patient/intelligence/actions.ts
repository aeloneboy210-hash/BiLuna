'use server'

import { revalidatePath } from 'next/cache'
import { requirePortal } from '@/lib/auth/require-portal'
import { parseProfileForm } from '@/lib/intelligence/profile-form'
import { deleteProfile, logEvent, saveProfile, setConsent } from '@/lib/intelligence/store'

export type ProfileState = { status: 'idle' | 'saved' | 'deleted' | 'failed' }

/** Each action runs as the signed-in patient; the database only lets them touch their own profile. */

export async function saveProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  await requirePortal('patient')
  const parsed = parseProfileForm(formData)
  if (!parsed.ok) return { status: 'failed' }
  if (!(await saveProfile(parsed.profile))) return { status: 'failed' }
  await logEvent('profile_saved').catch(() => {})
  revalidatePath('/patient', 'layout')
  return { status: 'saved' }
}

export async function deleteProfileAction(): Promise<ProfileState> {
  await requirePortal('patient')
  if (!(await deleteProfile())) return { status: 'failed' }
  await logEvent('profile_deleted').catch(() => {})
  revalidatePath('/patient', 'layout')
  return { status: 'deleted' }
}

export async function setConsentAction(on: boolean): Promise<boolean> {
  await requirePortal('patient')
  if (typeof on !== 'boolean') return false
  const ok = await setConsent(on)
  if (ok) await logEvent(on ? 'consent_on' : 'consent_off').catch(() => {})
  revalidatePath('/patient', 'layout')
  return ok
}

'use server'

import { requirePortal } from '@/lib/auth/require-portal'
import { saveReview, type Review } from '@/lib/consult/store'

const UUID = /^[0-9a-f-]{36}$/i

/** The doctor saves their note. The database refuses it if the patient has stopped sharing. */
export async function saveDoctorNote(input: { summaryId: string; body: string }): Promise<Review | null> {
  await requirePortal('doctor')
  if (!UUID.test(String(input.summaryId))) return null
  return saveReview(input.summaryId, input.body)
}

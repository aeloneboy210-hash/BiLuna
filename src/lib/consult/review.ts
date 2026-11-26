/** The longest doctor's note the database accepts. */
export const REVIEW_MAX = 1000

/** A doctor's note as it will be saved, or null when it is empty or too long (never cut silently). */
export function cleanReview(body: unknown): string | null {
  if (typeof body !== 'string') return null
  const text = body.trim()
  if (!text || text.length > REVIEW_MAX) return null
  return text
}

/** True when the patient changed the summary after the doctor wrote (or last edited) the note. */
export function noteIsOlder(noteAt: string, summaryAt: string | null | undefined): boolean {
  return !!summaryAt && new Date(noteAt).getTime() < new Date(summaryAt).getTime()
}

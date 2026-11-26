/** The longest doctor's note the database accepts. */
export const REVIEW_MAX = 1000

/** A doctor's note as it will be saved, or null when it is empty or too long (never cut silently). */
export function cleanReview(body: unknown): string | null {
  if (typeof body !== 'string') return null
  // Invisible characters and control codes (the database refuses NUL) are taken out, keeping new lines.
  const text = body
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
  // Counted in characters as the database counts them, so an emoji is one, not two.
  if (!text || [...text].length > REVIEW_MAX) return null
  return text
}

/** True when the patient changed the summary after the doctor wrote (or last edited) the note. */
export function noteIsOlder(noteAt: string, summaryAt: string | null | undefined): boolean {
  return !!summaryAt && new Date(noteAt).getTime() < new Date(summaryAt).getTime()
}

/**
 * A report or prescription the patient uploads. It is read once by the AI and then thrown away:
 * only a "📎 name" line and BiLuna's explanation are saved.
 */
export type Attachment = { name: string; mediaType: string; data: string }

export const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
/** 3 MB after decoding. Photos are shrunk in the browser first, so most are far smaller. */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

export function checkAttachment(a: Attachment): { ok: true } | { ok: false; error: 'fileType' | 'fileSize' } {
  if (!(ATTACHMENT_TYPES as readonly string[]).includes(a.mediaType)) return { ok: false, error: 'fileType' }
  if (typeof a.data !== 'string' || !a.data || !BASE64.test(a.data)) return { ok: false, error: 'fileType' }
  const padding = a.data.endsWith('==') ? 2 : a.data.endsWith('=') ? 1 : 0
  const bytes = Math.floor((a.data.length * 3) / 4) - padding
  if (bytes > MAX_ATTACHMENT_BYTES) return { ok: false, error: 'fileSize' }
  return { ok: true }
}

/** The line saved in the chat instead of the file: "📎 Lab report.jpg". */
export function attachmentLine(name: string): string {
  const base = String(name).split(/[\\/]/).pop()?.trim() || 'file'
  return `📎 ${base.slice(0, 60)}`
}

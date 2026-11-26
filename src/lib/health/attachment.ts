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
  // The first bytes must say the same type as the label: a file renamed to .jpg is refused.
  if (!startsLike(a.mediaType, a.data)) return { ok: false, error: 'fileType' }
  return { ok: true }
}

/** The opening bytes of each allowed type, as base64 text. */
function startsLike(mediaType: string, base64: string): boolean {
  // atob works on the server and in the browser (this file is shared); 24 base64 letters are 18 bytes.
  const head = atob(base64.slice(0, 24))
  const at = (i: number, ...b: number[]) => b.every((x, k) => head.charCodeAt(i + k) === x)
  if (mediaType === 'image/jpeg') return at(0, 0xff, 0xd8, 0xff)
  if (mediaType === 'image/png') return at(0, 0x89, 0x50, 0x4e, 0x47)
  if (mediaType === 'image/webp') return at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)
  if (mediaType === 'application/pdf') return at(0, 0x25, 0x50, 0x44, 0x46)
  return false
}

/** The line saved in the chat instead of the file: "📎 Lab report.jpg". */
export function attachmentLine(name: string): string {
  const base = String(name).split(/[\\/]/).pop()?.trim() || 'file'
  return `📎 ${base.slice(0, 60)}`
}

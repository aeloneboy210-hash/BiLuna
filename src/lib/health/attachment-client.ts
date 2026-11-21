'use client'

import { ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES, type Attachment } from './attachment'

/** Photos are shrunk to at most this many pixels on the long side: still readable, much faster on mobile data. */
const MAX_SIDE = 1800

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Turns a chosen file into an upload: photos become a smaller JPEG, PDFs are sent as they are. */
export async function prepareAttachment(file: Blob, name: string): Promise<Attachment | 'fileType' | 'fileSize'> {
  if (!(ATTACHMENT_TYPES as readonly string[]).includes(file.type)) return 'fileType'
  if (file.type === 'application/pdf') {
    if (file.size > MAX_ATTACHMENT_BYTES) return 'fileSize'
    return { name, mediaType: file.type, data: await toBase64(file) }
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'fileType'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) return 'fileType'
  if (blob.size > MAX_ATTACHMENT_BYTES) return 'fileSize'
  return { name, mediaType: 'image/jpeg', data: await toBase64(blob) }
}

import { attachmentLine, checkAttachment, MAX_ATTACHMENT_BYTES } from '@/lib/health/attachment'

const b64 = (bytes: number) => Buffer.alloc(bytes, 1).toString('base64')

test('photos and PDFs up to the size limit are accepted', () => {
  const heads: Record<string, number[]> = {
    'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  }
  for (const [mediaType, head] of Object.entries(heads)) {
    const data = Buffer.concat([Buffer.from(head), Buffer.alloc(1000)]).toString('base64')
    expect(checkAttachment({ name: 'report.jpg', mediaType, data })).toEqual({ ok: true })
  }
})

test('other file types, oversized files and broken data are refused', () => {
  expect(checkAttachment({ name: 'a.gif', mediaType: 'image/gif', data: b64(10) })).toEqual({ ok: false, error: 'fileType' })
  expect(checkAttachment({ name: 'a.exe', mediaType: 'application/x-msdownload', data: b64(10) })).toEqual({ ok: false, error: 'fileType' })
  expect(checkAttachment({ name: 'big.pdf', mediaType: 'application/pdf', data: b64(MAX_ATTACHMENT_BYTES + 1) })).toEqual({
    ok: false,
    error: 'fileSize',
  })
  expect(checkAttachment({ name: 'x.png', mediaType: 'image/png', data: 'not base64!!' })).toEqual({ ok: false, error: 'fileType' })
  expect(checkAttachment({ name: 'x.png', mediaType: 'image/png', data: '' })).toEqual({ ok: false, error: 'fileType' })
})

test('the chat line names the file, without folders, and short', () => {
  expect(attachmentLine('C:\\Users\\me\\Lab report.jpg')).toBe('📎 Lab report.jpg')
  expect(attachmentLine('a'.repeat(100) + '.pdf')).toHaveLength(2 + 1 + 60)
})

test('the first bytes must match the type: a renamed file is refused', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]).toString('base64')
  const pdf = Buffer.from('%PDF-1.7\n').toString('base64')
  expect(checkAttachment({ name: 'a.jpg', mediaType: 'image/jpeg', data: jpeg })).toEqual({ ok: true })
  expect(checkAttachment({ name: 'a.pdf', mediaType: 'application/pdf', data: pdf })).toEqual({ ok: true })
  expect(checkAttachment({ name: 'a.jpg', mediaType: 'image/jpeg', data: pdf })).toEqual({ ok: false, error: 'fileType' })
  expect(checkAttachment({ name: 'a.png', mediaType: 'image/png', data: Buffer.from('<html>').toString('base64') })).toEqual({
    ok: false,
    error: 'fileType',
  })
})

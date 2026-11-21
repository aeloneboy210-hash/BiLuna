import { attachmentLine, checkAttachment, MAX_ATTACHMENT_BYTES } from '@/lib/health/attachment'

const b64 = (bytes: number) => Buffer.alloc(bytes, 1).toString('base64')

test('photos and PDFs up to the size limit are accepted', () => {
  for (const mediaType of ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
    expect(checkAttachment({ name: 'report.jpg', mediaType, data: b64(1000) })).toEqual({ ok: true })
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

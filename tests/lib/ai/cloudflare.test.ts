import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { toCloudflareMessages } from '@/lib/ai/cloudflare'

test('instructions go first as the system message, then the chat in order', () => {
  const m = toCloudflareMessages('RULES', [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ])
  expect(m).toEqual([
    { role: 'system', content: 'RULES' },
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ])
})

test('a photo goes as an image; a PDF becomes a note asking for a photo, never guessed', () => {
  const [, msg] = toCloudflareMessages('R', [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'my report' },
        { type: 'file', data: 'AAAA', mediaType: 'image/jpeg', filename: 'a.jpg' },
        { type: 'file', data: 'BBBB', mediaType: 'application/pdf', filename: 'b.pdf' },
      ],
    },
  ])
  const parts = msg.content as { type: string; text?: string; image_url?: { url: string } }[]
  expect(parts[0]).toEqual({ type: 'text', text: 'my report' })
  expect(parts[1]).toEqual({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } })
  expect(parts[2].type).toBe('text')
  expect(parts[2].text).toMatch(/PDF/)
  expect(parts[2].text).toMatch(/photo/)
})
